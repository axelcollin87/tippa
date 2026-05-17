import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simBetsForStage(stage: string) {
  console.log(`Skapar slumpmässiga tips för alla användare för ${stage}...`);

  const users = await prisma.user.findMany();
  const matches = await prisma.match.findMany({ where: { stage } });

  if (matches.length === 0) {
    console.log(`Hittade inga matcher för ${stage}.`);
    return;
  }

  const signs = ['1', 'X', '2'];

  for (const match of matches) {
    // Ta bort gamla tips för dessa matcher om vi kör om
    await prisma.matchBet.deleteMany({
      where: { matchId: match.id }
    });

    const betsData = users.map(user => {
      const predictedSign = signs[Math.floor(Math.random() * signs.length)];
      // 50% chans att tippa hemmalaget som vinnare, annars bortalaget
      const predictedWinner = Math.random() > 0.5 ? match.homeTeam : match.awayTeam;

      return {
        userId: user.id,
        matchId: match.id,
        predictedSign,
        predictedWinner,
      };
    });

    await prisma.matchBet.createMany({
      data: betsData
    });
  }

  console.log(`✅ Skapade ${users.length * matches.length} tips för ${matches.length} matcher i ${stage}!`);
}

async function main() {
  const stage = process.argv[2];
  
  if (!stage) {
    console.log("Ange vilken runda du vill skapa tips för.");
    console.log("Möjliga argument: 'r32', 'r16', 'qf', 'sf', 'bronze', 'final'");
    return;
  }

  const map: Record<string, string> = {
    'r32': 'Round of 32',
    'r16': 'Round of 16',
    'qf': 'Quarter-final',
    'sf': 'Semi-final',
    'bronze': '3rd Place',
    'final': 'Final'
  };

  if (map[stage]) {
    await simBetsForStage(map[stage]);
  } else {
    console.log("Okänd fas. Använd 'r32', 'r16', 'qf', 'sf', 'bronze', 'final'");
  }
}

main().finally(() => prisma.$disconnect());
