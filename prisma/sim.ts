import { PrismaClient } from '@prisma/client';
import { calculatePointsForMatch, calculatePointsForGroup } from '../src/lib/scoring';

const prisma = new PrismaClient();

async function simGroups() {
  console.log('Simulerar alla gruppspelsmatcher (Hemma vinner 2-1)...');
  
  // Hitta alla matcher som tillhör en specifik grupp (ignorera "TBD" och null)
  const groupMatches = await prisma.match.findMany({
    where: { 
      AND: [
        { groupName: { not: null } },
        { groupName: { not: 'TBD' } }
      ]
    }
  });

  for (const m of groupMatches) {
    await prisma.match.update({
      where: { id: m.id },
      data: { homeScore: 2, awayScore: 1, actualSign: '1', isCompleted: true }
    });
    await calculatePointsForMatch(m.id);
  }

  console.log('Fastställer alla grupper (Hittar lagen och sätter en slumpmässig ordning)...');
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  let thirdPlaceTeams: string[] = [];

  for (const g of groups) {
    const matchesInGroup = groupMatches.filter(m => m.groupName === g);
    if (matchesInGroup.length === 0) continue;

    const teams = Array.from(new Set(matchesInGroup.flatMap(m => [m.homeTeam, m.awayTeam])));
    
    // Skapa en falsk placering baserat på ordningen de råkade hamna i arrayen
    const standings = [
      { rank: 1, teamName: teams[0] || `1${g}` },
      { rank: 2, teamName: teams[1] || `2${g}` },
      { rank: 3, teamName: teams[2] || `3${g}` },
      { rank: 4, teamName: teams[3] || `4${g}` }
    ];

    if (teams[2]) thirdPlaceTeams.push(teams[2]);

    await calculatePointsForGroup(g, standings);

    await prisma.officialGroupStanding.deleteMany({ where: { groupName: g } });
    await prisma.officialGroupStanding.createMany({
      data: standings.map(s => ({ groupName: g, teamName: s.teamName, rank: s.rank }))
    });

    // Skicka 1:an och 2:an vidare i trädet
    const treeMatches = await prisma.match.findMany({
      where: { groupName: null, isCompleted: false }
    });

    for (const tm of treeMatches) {
      let newHome = tm.homeTeam;
      let newAway = tm.awayTeam;
      
      if (newHome === `1${g}`) newHome = standings[0].teamName;
      if (newHome === `2${g}`) newHome = standings[1].teamName;
      if (newAway === `1${g}`) newAway = standings[0].teamName;
      if (newAway === `2${g}`) newAway = standings[1].teamName;
      
      if (newHome !== tm.homeTeam || newAway !== tm.awayTeam) {
        await prisma.match.update({
          where: { id: tm.id },
          data: { homeTeam: newHome, awayTeam: newAway }
        });
      }
    }
  }

  console.log('Fyller i bästa 3:orna i sextondelsfinalerna...');
  const r32 = await prisma.match.findMany({ where: { stage: 'Round of 32', isCompleted: false } });
  let tIndex = 0;
  
  for (const tm of r32) {
    let newHome = tm.homeTeam;
    let newAway = tm.awayTeam;
    
    // Placeringar som '3C/E/F/H/I' innehåller ett '/' tecken, vi ersätter dessa med ett riktigt lag
    if (newHome.includes('/')) newHome = thirdPlaceTeams[tIndex++ % thirdPlaceTeams.length];
    if (newAway.includes('/')) newAway = thirdPlaceTeams[tIndex++ % thirdPlaceTeams.length];

    if (newHome !== tm.homeTeam || newAway !== tm.awayTeam) {
      await prisma.match.update({
        where: { id: tm.id },
        data: { homeTeam: newHome, awayTeam: newAway }
      });
    }
  }

  console.log('✅ Gruppspelet är simulerat och klart!');
}

async function simStage(stage: string) {
  console.log(`Simulerar ${stage} (Hemmalaget vinner 2-0 och går vidare)...`);
  const matches = await prisma.match.findMany({ where: { stage, isCompleted: false } });
  
  if(matches.length === 0) {
    console.log(`Hittade inga ospelade matcher för ${stage}. Är föregående rundor simulerade?`);
    return;
  }

  for (const m of matches) {
    const winner = m.homeTeam;
    const loser = m.awayTeam;

    await prisma.match.update({
      where: { id: m.id },
      data: { homeScore: 2, awayScore: 0, actualSign: '1', actualWinner: winner, isCompleted: true }
    });
    
    await calculatePointsForMatch(m.id);

    // Skicka vinnaren (och ibland förloraren, t.ex. bronsmatch) vidare i trädet
    const futureMatches = await prisma.match.findMany({
      where: { groupName: null, isCompleted: false }
    });

    for (const fm of futureMatches) {
      let newHome = fm.homeTeam;
      let newAway = fm.awayTeam;
      
      if (newHome === `W${m.id}`) newHome = winner;
      if (newHome === `L${m.id}`) newHome = loser;
      if (newAway === `W${m.id}`) newAway = winner;
      if (newAway === `L${m.id}`) newAway = loser;
      
      if (newHome !== fm.homeTeam || newAway !== fm.awayTeam) {
        await prisma.match.update({
          where: { id: fm.id },
          data: { homeTeam: newHome, awayTeam: newAway }
        });
      }
    }
  }
  console.log(`✅ ${stage} är simulerad!`);
}

async function main() {
  const stage = process.argv[2];
  
  if (!stage) {
    console.log("Ange vad som ska simuleras.");
    console.log("Möjliga argument: 'groups', 'r32', 'r16', 'qf', 'sf', 'bronze', 'final'");
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

  if (stage === 'groups') {
    await simGroups();
  } else if (map[stage]) {
    await simStage(map[stage]);
  } else {
    console.log("Okänd fas. Använd 'groups', 'r32', 'r16', 'qf', 'sf', 'bronze', 'final'");
  }
}

main().finally(() => prisma.$disconnect());
