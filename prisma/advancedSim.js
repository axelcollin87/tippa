const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const userNames = [
  'Alfred', 'Beatrice', 'Carl', 'Diana', 'Erik', 
  'Filip', 'Gustav', 'Hanna', 'Ivar', 'Julia',
  'Kalle', 'Lisa', 'Mats', 'Nora', 'Olof',
  'Pia', 'Quinn', 'Rikard', 'Sara', 'Tor'
];

const STAKES = {
  "Group": 20,
  "Round of 16": 20,
  "Quarter-final": 40,
  "Semi-final": 80,
  "Final": 100,
  "3rd Place": 100
};

async function cleanup() {
  console.log('Rensar tidigare simuleringsdata...');
  const usersToDelete = await prisma.user.findMany({
    where: { email: { contains: '@example.com' } },
    select: { id: true },
  });
  const userIdsToDelete = usersToDelete.map(u => u.id);

  if (userIdsToDelete.length > 0) {
    await prisma.groupPlacementBet.deleteMany({ where: { userId: { in: userIdsToDelete } } });
    await prisma.matchBet.deleteMany({ where: { userId: { in: userIdsToDelete } } });
    await prisma.user.deleteMany({ where: { id: { in: userIdsToDelete } } });
  }
}

async function createUsers() {
  console.log(`Skapar ${userNames.length} nya användare...`);
  for (const name of userNames) {
    const email = `${name.toLowerCase()}@example.com`;
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isApproved: true,
      },
    });
  }
}

async function createMatches() {
  console.log('Skapar matcher (Gruppspel + Slutspel)...');
  await prisma.match.deleteMany({});
  
  const now = new Date();
  
  // Gruppspel (12 matcher)
  const groupMatches = [
    { stage: "Group", groupName: "A", homeTeam: "Sverige", awayTeam: "Brasilien", kickoff: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
    { stage: "Group", groupName: "A", homeTeam: "Senegal", awayTeam: "Japan", kickoff: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
    { stage: "Group", groupName: "B", homeTeam: "England", awayTeam: "USA", kickoff: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000) },
    { stage: "Group", groupName: "B", homeTeam: "Iran", awayTeam: "Wales", kickoff: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000) },
    { stage: "Group", groupName: "A", homeTeam: "Sverige", awayTeam: "Senegal", kickoff: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
    { stage: "Group", groupName: "A", homeTeam: "Brasilien", awayTeam: "Japan", kickoff: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
    { stage: "Group", groupName: "B", homeTeam: "England", awayTeam: "Iran", kickoff: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
    { stage: "Group", groupName: "B", homeTeam: "USA", awayTeam: "Wales", kickoff: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
    { stage: "Group", groupName: "A", homeTeam: "Japan", awayTeam: "Sverige", kickoff: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
    { stage: "Group", groupName: "A", homeTeam: "Brasilien", awayTeam: "Senegal", kickoff: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
    { stage: "Group", groupName: "B", homeTeam: "Wales", awayTeam: "England", kickoff: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
    { stage: "Group", groupName: "B", homeTeam: "USA", awayTeam: "Iran", kickoff: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
  ];

  // Slutspel (4 matcher)
  const knockoutMatches = [
    { stage: "Round of 16", homeTeam: "Sverige", awayTeam: "England", kickoff: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) },
    { stage: "Round of 16", homeTeam: "Brasilien", awayTeam: "USA", kickoff: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) },
    { stage: "Quarter-final", homeTeam: "Sverige", awayTeam: "Brasilien", kickoff: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) },
    { stage: "Final", homeTeam: "Brasilien", awayTeam: "Frankrike", kickoff: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) },
  ];

  for (const m of [...groupMatches, ...knockoutMatches]) {
    await prisma.match.create({ data: m });
  }
}

async function createBets(users, matches) {
  console.log('Skapar slumpade tips...');
  const bets = [];
  const signs = ['1', 'X', '2'];
  
  for (const match of matches) {
    for (const user of users) {
      const predictedSign = signs[Math.floor(Math.random() * signs.length)];
      const predictedWinner = Math.random() > 0.5 ? match.homeTeam : match.awayTeam;
      
      bets.push({
        userId: user.id,
        matchId: match.id,
        predictedSign,
        predictedWinner: match.stage !== "Group" ? predictedWinner : null,
      });
    }
  }
  
  await prisma.matchBet.createMany({ data: bets });
}

async function createGroupPlacements(users) {
  console.log('Skapar slumpade grupplaceringar...');
  const groups = ["A", "B"];
  const teams = {
    "A": ["Sverige", "Brasilien", "Senegal", "Japan"],
    "B": ["England", "USA", "Iran", "Wales"]
  };

  const placements = [];
  for (const user of users) {
    for (const group of groups) {
      const shuffled = [...teams[group]].sort(() => 0.5 - Math.random());
      shuffled.forEach((team, index) => {
        placements.push({
          userId: user.id,
          groupName: group,
          teamName: team,
          predictedRank: index + 1
        });
      });
    }
  }
  await prisma.groupPlacementBet.createMany({ data: placements });
}

async function simulateResults(matches, totalUsers) {
  console.log('Simulerar resultat och räknar poäng...');
  
  for (const match of matches) {
    const homeScore = Math.floor(Math.random() * 4);
    const awayScore = Math.floor(Math.random() * 4);
    const actualSign = homeScore > awayScore ? "1" : homeScore < awayScore ? "2" : "X";
    
    // För slutspel, välj en vinnare även vid X
    let actualWinner = null;
    if (match.stage !== "Group") {
      actualWinner = actualSign === "1" ? match.homeTeam : (actualSign === "2" ? match.awayTeam : (Math.random() > 0.5 ? match.homeTeam : match.awayTeam));
    }

    await prisma.match.update({
      where: { id: match.id },
      data: {
        isCompleted: true,
        homeScore,
        awayScore,
        actualSign,
        actualWinner
      }
    });

    // Poängberäkning (Duplicerad logik från scoring.ts för att slippa import-krångel)
    const matchWithBets = await prisma.match.findUnique({
      where: { id: match.id },
      include: { bets: true }
    });

    const stake = STAKES[match.stage] || 20;
    
    // 1X2 Pot
    const winners1X2 = matchWithBets.bets.filter(b => b.predictedSign === actualSign);
    const points1X2 = winners1X2.length > 0 ? Math.floor((totalUsers * stake) / winners1X2.length) : 0;
    
    for (const bet of winners1X2) {
      await prisma.matchBet.update({
        where: { id: bet.id },
        data: { pointsAwarded: points1X2 }
      });
    }

    // Progress Pot
    if (match.stage !== "Group" && actualWinner) {
      const winnersProgress = matchWithBets.bets.filter(b => b.predictedWinner === actualWinner);
      const pointsProgress = winnersProgress.length > 0 ? Math.floor((totalUsers * stake) / winnersProgress.length) : 0;
      
      for (const bet of winnersProgress) {
        await prisma.matchBet.update({
          where: { id: bet.id },
          data: { pointsAwardedProgress: pointsProgress }
        });
      }
    }
  }

  // Grupplaceringar (bara för Grupp A och B)
  const actualStandings = {
    "A": [
      { rank: 1, teamName: "Brasilien" },
      { rank: 2, teamName: "Sverige" },
      { rank: 3, teamName: "Japan" },
      { rank: 4, teamName: "Senegal" }
    ],
    "B": [
      { rank: 1, teamName: "England" },
      { rank: 2, teamName: "USA" },
      { rank: 3, teamName: "Wales" },
      { rank: 4, teamName: "Iran" }
    ]
  };

  for (const group of ["A", "B"]) {
    const bets = await prisma.groupPlacementBet.findMany({ where: { groupName: group } });
    for (const bet of bets) {
      const actualTeam = actualStandings[group].find(s => s.rank === bet.predictedRank).teamName;
      if (bet.teamName === actualTeam) {
        await prisma.groupPlacementBet.update({
          where: { id: bet.id },
          data: { pointsAwarded: 50 }
        });
      }
    }
  }
}

async function recalculateTotalScores() {
  const users = await prisma.user.findMany({
    include: { matchBets: true, groupPlacements: true }
  });

  for (const user of users) {
    const matchPoints = user.matchBets.reduce((sum, b) => sum + b.pointsAwarded + b.pointsAwardedProgress, 0);
    const groupPoints = user.groupPlacements.reduce((sum, b) => sum + b.pointsAwarded, 0);
    await prisma.user.update({
      where: { id: user.id },
      data: { totalScore: matchPoints + groupPoints }
    });
  }
}

async function main() {
  await cleanup();
  await createUsers();
  await createMatches();
  
  const users = await prisma.user.findMany({ where: { email: { contains: '@example.com' } } });
  const matches = await prisma.match.findMany();
  
  await createBets(users, matches);
  await createGroupPlacements(users);
  await simulateResults(matches, users.length);
  await recalculateTotalScores();
  
  const leaderboard = await prisma.user.findMany({
    where: { email: { contains: '@example.com' } },
    orderBy: { totalScore: 'desc' },
    take: 10
  });

  console.log('\n--- TOPP 10 LEDARTAVLA (SIMULERING) ---');
  leaderboard.forEach((u, i) => {
    console.log(`${i + 1}. ${u.name.padEnd(10)}: ${u.totalScore}p`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
