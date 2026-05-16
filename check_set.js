const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({ where: { groupName: 'B' } });
  
  const groups = {};
  for (const match of matches) {
    if (!groups[match.groupName]) groups[match.groupName] = new Set();
    groups[match.groupName].add(match.homeTeam);
    groups[match.groupName].add(match.awayTeam);
  }
  
  console.log(groups);
}
main().finally(() => prisma.$disconnect());
