import { prisma } from "./prisma";

// Multiplikatorer per runda
const STAGE_MULTIPLIERS: Record<string, number> = {
  "Group": 1,
  "Round of 32": 1.5, // Om det finns en 16-delsfinal i VM
  "Round of 16": 1.5,
  "Quarter-final": 2,
  "Semi-final": 2.5,
  "Final": 3,
  "3rd Place": 3
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
  // Avrunda till närmsta 10-tal innan multiplier
  const rawBasePoints1X2 = Math.max(MIN_BASE_POINTS, MAX_BASE_POINTS - percentage1X2);
  const basePoints1X2 = Math.round(rawBasePoints1X2 / 10) * 10;
  // Applicera multiplier (t.ex. 70 * 1.5 = 105)
  const finalPoints1X2 = Math.round(basePoints1X2 * multiplier);

  // --- BERÄKNING 2: Avancemang (endast slutspel) ---
  let finalPointsProgress = 0;
  let winnersProgress: typeof match.bets = [];
  
  if (stage !== "Group" && match.actualWinner) {
    // För avancemang kollar vi bara på de som faktiskt tippat ett avancemang
    const totalProgressBets = match.bets.filter(bet => bet.predictedWinner !== null).length;
    
    if (totalProgressBets > 0) {
      winnersProgress = match.bets.filter(bet => bet.predictedWinner === match.actualWinner);
      const percentageProgress = (winnersProgress.length / totalProgressBets) * 100;
      // Avrunda till närmsta 10-tal innan multiplier
      const rawBasePointsProgress = Math.max(MIN_BASE_POINTS, MAX_BASE_POINTS - percentageProgress);
      const basePointsProgress = Math.round(rawBasePointsProgress / 10) * 10;
      finalPointsProgress = Math.round(basePointsProgress * multiplier);
    }
  }

  // Nollställ poäng för ALLA tips på denna match först
  await prisma.matchBet.updateMany({
    where: { matchId: matchId },
    data: { pointsAwarded: 0, pointsAwardedProgress: 0 }
  });

  // Uppdatera vinnare för 1X2 i en batch
  if (finalPoints1X2 > 0 && winners1X2.length > 0) {
    const winnerIds = winners1X2.map(bet => bet.id);
    await prisma.matchBet.updateMany({
      where: { id: { in: winnerIds } },
      data: { pointsAwarded: finalPoints1X2 },
    });
  }

  // Uppdatera vinnare för Avancemang i en batch
  if (finalPointsProgress > 0 && winnersProgress.length > 0) {
    const progressWinnerIds = winnersProgress.map(bet => bet.id);
    await prisma.matchBet.updateMany({
      where: { id: { in: progressWinnerIds } },
      data: { pointsAwardedProgress: finalPointsProgress },
    });
  }

  // 5. Räkna om totalerna
  await recalculateAllUsersTotalScore();
}

/**
 * Delar ut poäng (100p) för varje rätt gissad placering i en specifik grupp.
 */
export async function calculatePointsForGroup(groupName: string, actualStandings: { rank: number, teamName: string }[]) {
  const groupBets = await prisma.groupPlacementBet.findMany({
    where: { groupName }
  });

  // Uppdatera placeringar (använder updateMany för bättre prestanda per poängnivå)
  await prisma.groupPlacementBet.updateMany({
    where: { groupName },
    data: { pointsAwarded: 0 }
  });

  // Hitta de bet som var rätt
  const winningBetIds: string[] = [];
  for (const bet of groupBets) {
    const actualTeamForThisRank = actualStandings.find(s => s.rank === bet.predictedRank)?.teamName;
    if (bet.teamName === actualTeamForThisRank) {
      winningBetIds.push(bet.id);
    }
  }

  if (winningBetIds.length > 0) {
    await prisma.groupPlacementBet.updateMany({
      where: { id: { in: winningBetIds } },
      data: { pointsAwarded: 100 },
    });
  }

  await recalculateAllUsersTotalScore();
}

/**
 * Hjälpfunktion för att räkna om allas totalpoäng.
 * Optimerad för att inte ladda in alla bets i minnet, utan utför det i databasen istället via Prisma aggregering.
 */
export async function recalculateAllUsersTotalScore() {
  // 1. Snapshot: Innan vi uppdaterar poängen, spara nuvarande rank som "previousRank" i alla ligor
  const leagues = await prisma.league.findMany({
    include: {
      members: {
        include: {
          user: { select: { totalScore: true } }
        }
      }
    }
  });

  for (const league of leagues) {
    // Sortera medlemmar efter nuvarande totalScore
    const sortedMembers = [...league.members].sort((a, b) => b.user.totalScore - a.user.totalScore);
    
    // Uppdatera previousRank för varje medlem
    for (let i = 0; i < sortedMembers.length; i++) {
      await prisma.leagueMember.update({
        where: { id: sortedMembers[i].id },
        data: { previousRank: i + 1 }
      });
    }
  }

  // 2. Uppdatera poängen (detta gör att ranken ändras i nästa steg/vy)
  await prisma.$executeRaw`
    UPDATE "User"
    SET "totalScore" = (
      COALESCE((SELECT SUM("pointsAwarded" + "pointsAwardedProgress") FROM "MatchBet" WHERE "MatchBet"."userId" = "User"."id"), 0) +
      COALESCE((SELECT SUM("pointsAwarded") FROM "GroupPlacementBet" WHERE "GroupPlacementBet"."userId" = "User"."id"), 0) +
      COALESCE((SELECT SUM("pointsAwarded") FROM "UserSidebet" WHERE "UserSidebet"."userId" = "User"."id"), 0)
    )
  `;
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
  const rawBasePoints = Math.max(MIN_BASE_POINTS, MAX_BASE_POINTS - percentage);
  const basePoints = Math.round(rawBasePoints / 10) * 10;
  
  return basePoints * multiplier;
}

