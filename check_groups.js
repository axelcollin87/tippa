const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({ where: { groupName: 'D' } });
  console.log('GROUP D MATCHES:', matches);
  
  const matchesB = await prisma.match.findMany({ where: { groupName: 'B' } });
  console.log('GROUP B MATCHES:', matchesB);
}

main().finally(() => prisma.$disconnect());
