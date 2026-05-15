import { prisma } from "./prisma";

// Multiplikatorer per runda
const STAGE_MULTIPLIERS: Record<string, number> = {
  "Group": 1,
  "Round of 16": 2,
  "Quarter-final": 3,
  "Semi-final": 4,
  "Final": 5,
  "3rd Place": 5
};

const MAX_BASE_POINTS = 100;
const MIN_BASE_POINTS = 10;

/**
 * Poängberäkning med Inverse Popularity-system.
 * 
 * 1. Räkna hur många som tippat på det vinnande tecknet vs totalt antal aktiva tips.
 * 2. Procentandel = (Antal rätta tips / Totalt antal tips på matchen) * 100
 * 3. Baspoäng = MAX(MIN_BASE_POINTS, MAX_BASE_POINTS - Procentandel)
 * 4. Slutpoäng = Baspoäng * Multiplikator för rundan
 */
export async function calculatePointsForMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { bets: true },
  });

  if (!match || !match.isCompleted || match.homeScore === null || match.awayScore === null) {
    return;
  }

  // 1. Räkna ut tecken
  const actualSign = match.homeScore > match.awayScore ? "1" : match.homeScore < match.awayScore ? "2" : "X";
  
  // Uppdatera matchen med tecken
  await prisma.match.update({
    where: { id: match.id },
    data: { actualSign }
  });

  const stage = match.stage || "Group";
  const multiplier = STAGE_MULTIPLIERS[stage] || 1;
  const totalBetsForMatch = match.bets.length;

  // Om ingen har tippat matchen behöver vi inte göra något
  if (totalBetsForMatch === 0) return;

  // --- BERÄKNING 1: 1X2 ---
  const winners1X2 = match.bets.filter(bet => bet.predictedSign === actualSign);
  const percentage1X2 = (winners1X2.length / totalBetsForMatch) * 100;
  const basePoints1X2 = Math.max(MIN_BASE_POINTS, Math.round(MAX_BASE_POINTS - percentage1X2));
  const finalPoints1X2 = basePoints1X2 * multiplier;

  // --- BERÄKNING 2: Avancemang (endast slutspel) ---
  let finalPointsProgress = 0;
  let winnersProgress: typeof match.bets = [];
  
  if (stage !== "Group" && match.actualWinner) {
    // För avancemang kollar vi bara på de som faktiskt tippat ett avancemang
    const totalProgressBets = match.bets.filter(bet => bet.predictedWinner !== null).length;
    
    if (totalProgressBets > 0) {
      winnersProgress = match.bets.filter(bet => bet.predictedWinner === match.actualWinner);
      const percentageProgress = (winnersProgress.length / totalProgressBets) * 100;
      const basePointsProgress = Math.max(MIN_BASE_POINTS, Math.round(MAX_BASE_POINTS - percentageProgress));
      finalPointsProgress = basePointsProgress * multiplier;
    }
  }

  // Nollställ poäng för ALLA tips på denna match först
  await prisma.matchBet.updateMany({
    where: { matchId: matchId },
    data: { pointsAwarded: 0, pointsAwardedProgress: 0 }
  });

  // Uppdatera vinnare för 1X2
  if (finalPoints1X2 > 0) {
    for (const bet of winners1X2) {
      await prisma.matchBet.update({
        where: { id: bet.id },
        data: { pointsAwarded: finalPoints1X2 },
      });
    }
  }

  // Uppdatera vinnare för Avancemang
  if (finalPointsProgress > 0) {
    for (const bet of winnersProgress) {
      await prisma.matchBet.update({
        where: { id: bet.id },
        data: { pointsAwardedProgress: finalPointsProgress },
      });
    }
  }

  // 5. Räkna om totalerna
  await recalculateAllUsersTotalScore();
}

/**
 * Delar ut poäng (50p) för varje rätt gissad placering i en specifik grupp.
 */
export async function calculatePointsForGroup(groupName: string, actualStandings: { rank: number, teamName: string }[]) {
  const groupBets = await prisma.groupPlacementBet.findMany({
    where: { groupName }
  });

  for (const bet of groupBets) {
    const actualTeamForThisRank = actualStandings.find(s => s.rank === bet.predictedRank)?.teamName;
    const points = (bet.teamName === actualTeamForThisRank) ? 50 : 0;

    await prisma.groupPlacementBet.update({
      where: { id: bet.id },
      data: { pointsAwarded: points },
    });
  }

  await recalculateAllUsersTotalScore();
}

/**
 * Hjälpfunktion för att räkna om allas totalpoäng.
 */
export async function recalculateAllUsersTotalScore() {
  const users = await prisma.user.findMany({
    include: { 
      matchBets: true,
      groupPlacements: true 
    },
  });

  for (const user of users) {
    const totalMatchPoints = user.matchBets.reduce((sum, bet) => sum + bet.pointsAwarded + bet.pointsAwardedProgress, 0);
    const totalGroupPoints = user.groupPlacements.reduce((sum, bet) => sum + bet.pointsAwarded, 0);
    
    const finalScore = totalMatchPoints + totalGroupPoints;

    await prisma.user.update({
      where: { id: user.id },
      data: { totalScore: finalScore },
    });
  }
}

/**
 * Beräknar potentiella poäng för ett givet tecken (1, X, 2) i en match,
 * givet hur andra användare redan har tippat (Inverse Popularity).
 */
export async function getPotentialWinningsForSign(matchId: string, predictedSign: string): Promise<number> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { bets: true },
  });

  if (!match) return 0;

  const stage = match.stage || "Group";
  const multiplier = STAGE_MULTIPLIERS[stage] || 1;
  const totalBets = match.bets.length;

  // Om ingen tippat än (eller bara vi), antar vi 0% popularitet = MAX poäng
  if (totalBets === 0) {
    return MAX_BASE_POINTS * multiplier;
  }

  const betsForSign = match.bets.filter(bet => bet.predictedSign === predictedSign);
  // Om vi tittar på vår egen potentiella vinst men inte har lagt bettet än,
  // lägger vi till +1 på totalen och +1 på tecknet virtuellt
  const isHypothetical = true; // Detta kunde optimeras om vi vet om användaren redan tippat
  
  const hypotheticalTotal = isHypothetical ? totalBets + 1 : totalBets;
  const hypotheticalSignBets = isHypothetical ? betsForSign.length + 1 : betsForSign.length;

  const percentage = (hypotheticalSignBets / hypotheticalTotal) * 100;
  const basePoints = Math.max(MIN_BASE_POINTS, Math.round(MAX_BASE_POINTS - percentage));
  
  return basePoints * multiplier;
}

