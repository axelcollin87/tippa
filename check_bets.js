const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bets = await prisma.groupPlacementBet.findMany({ where: { groupName: 'D' } });
  console.log('GROUP D BETS:', bets);
}

main().finally(() => prisma.$disconnect());
