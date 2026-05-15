const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Rensar databasen på gamla testdata...");
  await prisma.matchBet.deleteMany({});
  await prisma.groupPlacementBet.deleteMany({});
  await prisma.match.deleteMany({});

  const now = new Date().getTime();
  const baseTime = now + 5 * 24 * 60 * 60 * 1000; // Första matchen om 5 dagar

  console.log("Skapar en komplett Grupp A med 4 lag (6 matcher)...");
  
  const matches = [
    // Omgång 1
    { stage: "GROUP", groupName: "A", homeTeam: "Sverige", awayTeam: "Brasilien", kickoff: new Date(baseTime) },
    { stage: "GROUP", groupName: "A", homeTeam: "Senegal", awayTeam: "Japan", kickoff: new Date(baseTime + 2 * 60 * 60 * 1000) },
    
    // Omgång 2
    { stage: "GROUP", groupName: "A", homeTeam: "Sverige", awayTeam: "Senegal", kickoff: new Date(baseTime + 4 * 24 * 60 * 60 * 1000) },
    { stage: "GROUP", groupName: "A", homeTeam: "Brasilien", awayTeam: "Japan", kickoff: new Date(baseTime + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000) },
    
    // Omgång 3
    { stage: "GROUP", groupName: "A", homeTeam: "Japan", awayTeam: "Sverige", kickoff: new Date(baseTime + 8 * 24 * 60 * 60 * 1000) },
    { stage: "GROUP", groupName: "A", homeTeam: "Brasilien", awayTeam: "Senegal", kickoff: new Date(baseTime + 8 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000) }
  ];

  for (const match of matches) {
    await prisma.match.create({ data: match });
  }



  console.log("Seeding klar! 6 matcher inlagda för Grupp A.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
