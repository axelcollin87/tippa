const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Namn för våra simulerade användare
const userNames = [
  'Alfred',
  'Beatrice',
  'Carl',
  'Diana',
  'Erik'
];

async function main() {
  console.log('Startar simulering...');

  // 1. Rensa tidigare simulerad data (för att kunna köra skriptet flera gånger)
  // Vi tar bort alla användare utom den vars e-post finns i env-variabeln
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error('Fel: ADMIN_EMAIL är inte satt i .env-filen. Avbryter för säkerhets skull.');
    return;
  }
  const usersToDelete = await prisma.user.findMany({
    where: {
      email: {
        not: adminEmail,
      },
    },
    select: {
      id: true,
    }
  });
  const userIdsToDelete = usersToDelete.map(u => u.id);

  if (userIdsToDelete.length > 0) {
    await prisma.groupPlacementBet.deleteMany({
      where: {
        userId: {
          in: userIdsToDelete,
        },
      },
    });
    await prisma.matchBet.deleteMany({
      where: {
        userId: {
          in: userIdsToDelete,
        },
      },
    });
    console.log('Rensat gamla simulerade användares tips.');
  }

  await prisma.user.deleteMany({
    where: {
      email: {
        not: adminEmail,
      },
    },
  });
  console.log('Rensat gamla simulerade användare.');

  // 2. Skapa 5 nya användare
  const createdUsers = [];
  for (const name of userNames) {
    const email = `${name.toLowerCase()}@example.com`;
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isApproved: true, // Godkänn dem direkt
      },
    });
    createdUsers.push(user);
    console.log(`Skapade användare: ${name}`);
  }

  // Hämta tillbaka admin-användaren så alla kan delta i tippningen
  const allUsers = await prisma.user.findMany();

  // 3. Hämta de två närmaste, ej spelade, matcherna
  const matchesToBetOn = await prisma.match.findMany({
    where: { isCompleted: false },
    orderBy: { kickoff: 'asc' },
    take: 2,
  });

  if (matchesToBetOn.length < 2) {
    console.log('Hittade inte tillräckligt med kommande matcher att tippa på. Avbryter.');
    return;
  }

  console.log(`Valde matcher för simulering: ${matchesToBetOn[0].homeTeam} vs ${matchesToBetOn[0].awayTeam} och ${matchesToBetOn[1].homeTeam} vs ${matchesToBetOn[1].awayTeam}`);

  // 4. Skapa slumpade tips för alla användare på dessa två matcher
  const signs = ['1', 'X', '2'];
  const bets = [];

  for (const match of matchesToBetOn) {
    for (const user of allUsers) {
      const randomSign = signs[Math.floor(Math.random() * signs.length)];
      bets.push({
        userId: user.id,
        matchId: match.id,
        predictedSign: randomSign,
      });
    }
  }
  
  // Rensa eventuella existerande bets på dessa matcher och skapa de nya
  await prisma.matchBet.deleteMany({
    where: {
      matchId: {
        in: matchesToBetOn.map(m => m.id),
      }
    }
  });

  await prisma.matchBet.createMany({
    data: bets,
  });

  console.log(`Skapade ${bets.length} slumpade tips för ${matchesToBetOn.length} matcher.`);
  console.log('Simulering slutförd!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
