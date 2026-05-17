import { PrismaClient } from '@prisma/client';
import { calculatePointsForMatch, calculatePointsForGroup } from '../src/lib/scoring';

const prisma = new PrismaClient();

async function simulateStage(stage: string) {
  console.log(`\n--- Simulerar matcher för: ${stage} ---`);
  
  const matches = await prisma.match.findMany({
    where: { stage, isCompleted: false },
  });

  if (matches.length === 0) {
    console.log(`Inga oavslutade matcher hittades för ${stage}.`);
    return;
  }

  console.log(`Hittade ${matches.length} matcher att simulera.`);

  for (const match of matches) {
    const homeScore = Math.floor(Math.random() * 4);
    const awayScore = Math.floor(Math.random() * 4);
    
    let actualWinner = null;
    if (stage !== "Group") {
      // Om det är oavgjort, välj en slumpmässig vinnare, annars den som vann
      if (homeScore > awayScore) actualWinner = match.homeTeam;
      else if (homeScore < awayScore) actualWinner = match.awayTeam;
      else actualWinner = Math.random() > 0.5 ? match.homeTeam : match.awayTeam;
    }

    await prisma.match.update({
      where: { id: match.id },
      data: {
        homeScore,
        awayScore,
        actualWinner,
        isCompleted: true,
      },
    });

    await calculatePointsForMatch(match.id);

    // Auto-fyll nästa runda i slutspelsträdet om vi har en vinnare
    if (actualWinner) {
      const loser = actualWinner === match.homeTeam ? match.awayTeam : match.homeTeam;
      
      const futureMatches = await prisma.match.findMany({
        where: {
          groupName: null,
          isCompleted: false,
          OR: [
            { homeTeam: { in: [`W${match.id}`, `L${match.id}`] } },
            { awayTeam: { in: [`W${match.id}`, `L${match.id}`] } }
          ]
        }
      });

      for (const futureMatch of futureMatches) {
        let newHome = futureMatch.homeTeam;
        let newAway = futureMatch.awayTeam;

        if (newHome === `W${match.id}`) newHome = actualWinner;
        if (newHome === `L${match.id}`) newHome = loser;
        if (newAway === `W${match.id}`) newAway = actualWinner;
        if (newAway === `L${match.id}`) newAway = loser;

        await prisma.match.update({
          where: { id: futureMatch.id },
          data: { homeTeam: newHome, awayTeam: newAway }
        });
      }
    }

    console.log(`✅ Match ${match.id} (${match.homeTeam} vs ${match.awayTeam}): ${homeScore}-${awayScore} ${actualWinner ? `-> ${actualWinner} vidare` : ''}`);
  }
}

async function finalizeGroups() {
  console.log(`\n--- Fastställer Grupper ---`);
  
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  
  for (const groupName of groups) {
    // Hämta alla matcher i gruppen
    const matches = await prisma.match.findMany({
      where: { groupName },
    });

    if (matches.length === 0 || !matches.every(m => m.isCompleted)) {
      console.log(`Grupp ${groupName} är inte färdigspelad.`);
      continue;
    }

    // Enkel poänguträkning för tabellen (3p för vinst, 1p för oavgjort)
    const points: Record<string, number> = {};
    for (const match of matches) {
      if (!points[match.homeTeam]) points[match.homeTeam] = 0;
      if (!points[match.awayTeam]) points[match.awayTeam] = 0;

      if (match.homeScore! > match.awayScore!) points[match.homeTeam] += 3;
      else if (match.homeScore! < match.awayScore!) points[match.awayTeam] += 3;
      else {
        points[match.homeTeam] += 1;
        points[match.awayTeam] += 1;
      }
    }

    // Sortera bara på poäng (förenklat)
    const standings = Object.entries(points)
      .sort((a, b) => b[1] - a[1])
      .map(([teamName], index) => ({
        rank: index + 1,
        teamName,
      }));

    if (standings.length !== 4) continue;

    console.log(`Fastställer Grupp ${groupName}: 1. ${standings[0].teamName}, 2. ${standings[1].teamName}`);

    await calculatePointsForGroup(groupName, standings);

    // Spara officiella resultat i databasen
    await prisma.officialGroupStanding.deleteMany({ where: { groupName } });
    await prisma.officialGroupStanding.createMany({
      data: standings.map(s => ({
        groupName,
        teamName: s.teamName,
        rank: s.rank
      }))
    });

    // Auto-fyll slutspelsträdet för 1an och 2an
    const matchesToUpdate = await prisma.match.findMany({
      where: {
        groupName: null,
        isCompleted: false,
        OR: [
          { homeTeam: { in: [`1${groupName}`, `2${groupName}`] } },
          { awayTeam: { in: [`1${groupName}`, `2${groupName}`] } }
        ]
      }
    });

    for (const match of matchesToUpdate) {
      let newHome = match.homeTeam;
      let newAway = match.awayTeam;

      if (newHome === `1${groupName}`) newHome = standings[0].teamName;
      if (newHome === `2${groupName}`) newHome = standings[1].teamName;
      if (newAway === `1${groupName}`) newAway = standings[0].teamName;
      if (newAway === `2${groupName}`) newAway = standings[1].teamName;

      await prisma.match.update({
        where: { id: match.id },
        data: { homeTeam: newHome, awayTeam: newAway }
      });
    }
  }
}

async function resolveThirdPlacePlaceholders() {
  console.log(`\n--- Ersätter 3:or i sextondelsfinalerna ---`);
  
  // Plocka ut alla placeholders och bara stoppa in ett slumpmässigt land
  // Eftersom vi inte vet de exakta uträkningarna för de 8 bästa 3:orna
  const dummyTeams = ['Sverige', 'Norge', 'Finland', 'Danmark', 'Island', 'Tyskland', 'Polen', 'Kroatien'];
  let dummyIndex = 0;

  const matches = await prisma.match.findMany({
    where: { stage: 'Round of 32', isCompleted: false }
  });

  for (const match of matches) {
    let newHome = match.homeTeam;
    let newAway = match.awayTeam;

    if (newHome.startsWith('3')) {
      newHome = dummyTeams[dummyIndex % dummyTeams.length];
      dummyIndex++;
    }
    if (newAway.startsWith('3')) {
      newAway = dummyTeams[dummyIndex % dummyTeams.length];
      dummyIndex++;
    }

    if (newHome !== match.homeTeam || newAway !== match.awayTeam) {
      await prisma.match.update({
        where: { id: match.id },
        data: { homeTeam: newHome, awayTeam: newAway }
      });
      console.log(`Bytte placeholder i match ${match.id} till ${newHome} vs ${newAway}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const stage = args[0];

  if (!stage) {
    console.log("Användning: npx tsx prisma/sim_tournament.ts <stage>");
    console.log("Möjliga stages: 'Group', 'Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', '3rd Place', 'Final', 'All'");
    return;
  }

  if (stage === 'All') {
    await simulateStage('Group');
    await finalizeGroups();
    await resolveThirdPlacePlaceholders();
    await simulateStage('Round of 32');
    await simulateStage('Round of 16');
    await simulateStage('Quarter-final');
    await simulateStage('Semi-final');
    await simulateStage('3rd Place');
    await simulateStage('Final');
  } else if (stage === 'Group') {
    await simulateStage('Group');
    await finalizeGroups();
    await resolveThirdPlacePlaceholders(); // Prep for R32
  } else {
    await simulateStage(stage);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
