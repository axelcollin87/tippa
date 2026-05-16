const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('abc123', 10);
  const names = [
    'Anders Andersson', 'Beata Bengtsson', 'Cecilia Carlsson', 'David Davidsson',
    'Erik Eriksson', 'Frida Fredriksson', 'Gustav Gustafsson', 'Hanna Hansson',
    'Isak Isaksson', 'Johanna Johansson'
  ];

  console.log('Skapar 10 testanvändare...');

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const email = `${name.split(' ')[0].toLowerCase()}@example.com`;

    await prisma.user.upsert({
      where: { email },
      update: { password, isApproved: true },
      create: {
        email,
        name,
        password,
        isApproved: true,
        totalScore: 0
      }
    });
    console.log(`Skapad: ${name} (${email})`);
  }

  console.log('Klart!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
