const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Aktiverar de två närmaste matcherna...');

  // 1. Hämta de två närmaste, ej spelade, matcherna
  const matchesToActivate = await prisma.match.findMany({
    where: { isCompleted: false },
    orderBy: { kickoff: 'asc' },
    take: 2,
  });

  if (matchesToActivate.length === 0) {
    console.log('Inga kommande matcher att aktivera.');
    return;
  }

  // 2. Sätt deras kickoff-tid till en minut i förfluten tid
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  for (const match of matchesToActivate) {
    await prisma.match.update({
      where: { id: match.id },
      data: { kickoff: oneMinuteAgo },
    });
    console.log(`Match ${match.homeTeam} vs ${match.awayTeam} har nu kickoff-tid ${oneMinuteAgo.toLocaleString()}`);
  }

  console.log('Aktivering slutförd. Ladda om startsidan för att se ändringarna.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
