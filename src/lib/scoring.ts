import { prisma } from "./prisma";

/**
 * Poängberäkning med Parimutuel Pot-system.
 * 
 * 1. Admin matar in slutresultat (mål).
 * 2. Systemet räknar ut 'actualSign' (1, X, 2).
 * 3. Potten = Totalt antal användare i ligan * 2.
 * 4. Alla som tippade rätt 'actualSign' delar lika på potten.
 * 5. Om ingen tippade rätt -> Potten brinner inne (0p).
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

  // Spara actualSign på matchen för historik
  await prisma.match.update({
    where: { id: match.id },
    data: { actualSign }
  });

  // 2. Beräkna den totala potten (Alla spelare i hela systemet "betalar" 2p)
  const totalUsers = await prisma.user.count();
  const totalPot = totalUsers * 2;

  // 3. Hitta vinnarna
  const winningBets = match.bets.filter(bet => bet.predictedSign === actualSign);
  const numberOfWinners = winningBets.length;

  // 4. Dela ut poäng
  let pointsPerWinner = 0;
  if (numberOfWinners > 0) {
    pointsPerWinner = totalPot / numberOfWinners;
    // Avrunda till en decimal för att undvika fula flyttal
    pointsPerWinner = Math.round(pointsPerWinner * 10) / 10;
  }

  // Nollställ poäng för ALLA tips på denna match först (om man uppdaterar resultatet)
  await prisma.matchBet.updateMany({
    where: { matchId: matchId },
    data: { pointsAwarded: 0 }
  });

  // Dela ut poängen till vinnarna
  for (const bet of winningBets) {
    await prisma.matchBet.update({
      where: { id: bet.id },
      data: { pointsAwarded: pointsPerWinner },
    });
  }

  // 5. Räkna om totalerna
  await recalculateAllUsersTotalScore();
}

/**
 * Delar ut poäng (5p) för varje rätt gissad placering i en specifik grupp.
 */
export async function calculatePointsForGroup(groupName: string, actualStandings: { rank: number, teamName: string }[]) {
  const groupBets = await prisma.groupPlacementBet.findMany({
    where: { groupName }
  });

  for (const bet of groupBets) {
    const actualTeamForThisRank = actualStandings.find(s => s.rank === bet.predictedRank)?.teamName;
    const points = (bet.teamName === actualTeamForThisRank) ? 5 : 0;

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
async function recalculateAllUsersTotalScore() {
  const users = await prisma.user.findMany({
    include: { 
      matchBets: true,
      groupPlacements: true 
    },
  });

  for (const user of users) {
    const totalMatchPoints = user.matchBets.reduce((sum, bet) => sum + bet.pointsAwarded, 0);
    const totalGroupPoints = user.groupPlacements.reduce((sum, bet) => sum + bet.pointsAwarded, 0);
    
    // Runda till 1 decimal
    const finalScore = Math.round((totalMatchPoints + totalGroupPoints) * 10) / 10;

    await prisma.user.update({
      where: { id: user.id },
      data: { totalScore: finalScore },
    });
  }
}
