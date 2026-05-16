"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculatePointsForMatch, calculatePointsForGroup, recalculateAllUsersTotalScore } from "@/lib/scoring";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { fetchWorldCupData } from "@/lib/openfootball";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.isAdmin) {
    throw new Error("Unauthorized");
  }
}

// --- TESTVERKTYG OCH SIMULERING ---

export async function clearAllBets() {
  await requireAdmin();
  await prisma.matchBet.deleteMany();
  await prisma.groupPlacementBet.deleteMany();
  await prisma.officialGroupStanding.deleteMany();
  await prisma.userSidebet.deleteMany();
  await prisma.user.updateMany({ data: { totalScore: 0 } });
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/bets");
}

export async function seedCrystalBallQuestions() {
  await requireAdmin();
  
  const existing = await prisma.sidebetQuestion.count();
  if (existing > 0) return;

  // Sätt låsningstiden till VM-premiären (exempel: 11 juni 2026 kl 20:00)
  // Detta bör egentligen dynamiskt vara den första matchens kickoff
  const firstMatch = await prisma.match.findFirst({ orderBy: { kickoff: 'asc' } });
  const lockedAt = firstMatch ? firstMatch.kickoff : new Date('2026-06-11T20:00:00Z');

  const questions = [
    { question: 'Vinnare av Fotbolls-VM', points: 150, lockedAt },
    { question: 'Tvåa i Fotbolls-VM (Silver)', points: 100, lockedAt },
    { question: 'Trea i Fotbolls-VM (Brons)', points: 75, lockedAt },
    { question: 'Skyttekung (Spelare)', points: 150, lockedAt },
    { question: 'Målmaskinen (Laget som gör flest mål i gruppspelet)', points: 75, lockedAt },
    { question: 'Kortleken (Lag som får flest röda kort)', points: 50, lockedAt },
    { question: 'Största floppen (Lag som åker ur gruppspelet med 0 poäng)', points: 50, lockedAt },
  ];

  await prisma.sidebetQuestion.createMany({ data: questions });
  revalidatePath("/admin");
  revalidatePath("/bets");
}

export async function resolveCrystalBallQuestion(formData: FormData) {
  await requireAdmin();
  const questionId = formData.get("questionId") as string;
  const correctAnswer = formData.get("correctAnswer") as string;

  if (!correctAnswer || correctAnswer.trim() === "") return;

  const question = await prisma.sidebetQuestion.findUnique({
    where: { id: questionId },
    include: { userBets: true }
  });

  if (!question) throw new Error("Frågan hittades inte.");

  // Uppdatera facit
  await prisma.sidebetQuestion.update({
    where: { id: questionId },
    data: { correctAnswer: correctAnswer.trim() }
  });

  // Rätta tipsen
  for (const bet of question.userBets) {
    const isCorrect = bet.answer.toLowerCase() === correctAnswer.toLowerCase().trim();
    const points = isCorrect ? question.points : 0;

    await prisma.userSidebet.update({
      where: { id: bet.id },
      data: { pointsAwarded: points }
    });
  }

  await recalculateAllUsersTotalScore();

  revalidatePath("/admin");
  revalidatePath("/bets");
  revalidatePath("/");
}

export async function clearAllMatchResults() {
  await requireAdmin();
  
  // Nollställ alla matcher
  await prisma.match.updateMany({
    data: {
      homeScore: null,
      awayScore: null,
      actualSign: null,
      actualWinner: null,
      isCompleted: false
    }
  });

  // Återställ lag-namnen till original-placeholders från API:et
  try {
    const rawMatches = await fetchWorldCupData();
    for (const rm of rawMatches) {
      const matchId = rm.num?.toString() || `${rm.date}-${rm.team1}-${rm.team2}`;
      await prisma.match.updateMany({
        where: { id: matchId },
        data: { homeTeam: rm.team1, awayTeam: rm.team2 }
      });
    }
  } catch (error) {
    console.error("Kunde inte hämta API-data för att återställa slutspelsträdet:", error);
  }

  // Nollställ poängen i alla tips (men behåll själva tipsen)
  await prisma.matchBet.updateMany({
    data: {
      pointsAwarded: 0,
      pointsAwardedProgress: 0
    }
  });

  // Nollställ officiella grupptabeller
  await prisma.officialGroupStanding.deleteMany();

  // Räkna om allas totalpoäng (blir 0)
  await prisma.user.updateMany({
    data: { totalScore: 0 }
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/bets");
}

export async function generateRandomGroupBets() {
  await requireAdmin();
  const users = await prisma.user.findMany();
  const matches = await prisma.match.findMany({ where: { groupName: { not: null } } });
  
  const signs = ['1', 'X', '2'];
  const matchBets = [];
  
  // Rensa gamla grupptips först för att undvika konflikter
  await prisma.matchBet.deleteMany({ where: { match: { groupName: { not: null } } } });
  
  for (const user of users) {
    for (const match of matches) {
      matchBets.push({
        userId: user.id,
        matchId: match.id,
        predictedSign: signs[Math.floor(Math.random() * signs.length)],
        pointsAwarded: 0,
        pointsAwardedProgress: 0
      });
    }
  }
  await prisma.matchBet.createMany({ data: matchBets });

  // Slumpa placeringar
  const groups: Record<string, Set<string>> = {};
  for (const match of matches) {
    if (match.groupName) {
      if (!groups[match.groupName]) groups[match.groupName] = new Set();
      groups[match.groupName].add(match.homeTeam);
      groups[match.groupName].add(match.awayTeam);
    }
  }

  await prisma.groupPlacementBet.deleteMany();
  const placements: { userId: string; groupName: string; teamName: string; predictedRank: number; }[] = [];
  for (const user of users) {
     for (const groupName of Object.keys(groups)) {
       const teams = Array.from(groups[groupName]).sort(() => 0.5 - Math.random());
       teams.forEach((team, idx) => {
         placements.push({
           userId: user.id,
           groupName,
           teamName: team as string,
           predictedRank: idx + 1
         });
       });
     }
  }
  await prisma.groupPlacementBet.createMany({ data: placements });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/bets");
}

export async function simulateMatch(formData: FormData) {
  await requireAdmin();
  const matchId = formData.get("matchId") as string;
  const homeScore = Math.floor(Math.random() * 4);
  const awayScore = Math.floor(Math.random() * 4);
  
  const actualSign = homeScore > awayScore ? "1" : homeScore < awayScore ? "2" : "X";
  
  const match = await prisma.match.findUnique({where: {id: matchId}});
  let actualWinner = null;
  if (!match?.groupName) {
     actualWinner = actualSign === "1" ? match?.homeTeam : (actualSign === "2" ? match?.awayTeam : (Math.random() > 0.5 ? match?.homeTeam : match?.awayTeam));
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore, actualWinner, isCompleted: true }
  });
  
  await calculatePointsForMatch(matchId);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function clearMatchResult(formData: FormData) {
  await requireAdmin();
  const matchId = formData.get("matchId") as string;
  
  await prisma.match.update({
     where: { id: matchId },
     data: { homeScore: null, awayScore: null, actualSign: null, actualWinner: null, isCompleted: false }
  });

  await prisma.matchBet.updateMany({
     where: { matchId },
     data: { pointsAwarded: 0, pointsAwardedProgress: 0 }
  });
  
  await recalculateAllUsersTotalScore();

  revalidatePath("/");
  revalidatePath("/admin");
}

// --- ÄLDRE FUNKTIONER ---

export async function syncWithGitHub() {
  await requireAdmin();
  
  try {
    const matches = await fetchWorldCupData();
    let updatedCount = 0;

    // Nollställ databasen (Tips och Matcher)
    await prisma.matchBet.deleteMany();
    await prisma.groupPlacementBet.deleteMany();
    await prisma.officialGroupStanding.deleteMany();
    await prisma.userSidebet.deleteMany();
    await prisma.match.deleteMany();

    for (const match of matches) {
      const isKnockout = !match.group;
      const matchId = match.num?.toString() || `${match.date}-${match.team1}-${match.team2}`;
      
      let isoTimeString = "00:00:00+00:00"; 
      if (match.time) {
        const timeParts = match.time.split(" ");
        const clockStr = timeParts[0]; 
        let offsetStr = "+00:00";
        
        if (timeParts.length > 1 && timeParts[1].startsWith("UTC")) {
          const rawOffset = timeParts[1].replace("UTC", ""); 
          if (rawOffset !== "") {
             const sign = rawOffset.startsWith("-") ? "-" : "+";
             const num = Math.abs(parseInt(rawOffset, 10));
             offsetStr = `${sign}${num.toString().padStart(2, "0")}:00`;
          }
        }
        isoTimeString = `${clockStr}:00${offsetStr}`;
      }
      
      const kickoff = new Date(`${match.date}T${isoTimeString}`);

      // Extrahera gruppbokstav från "Group A" -> "A", eller null för slutspel
      const groupName = match.group ? match.group.replace("Group ", "").trim() : null;
      
      await prisma.match.upsert({
        where: { id: matchId },
        update: {
          homeTeam: match.team1,
          awayTeam: match.team2,
          kickoff: kickoff,
          stage: match.round,
          groupName: groupName,
          ground: match.ground,
        },
        create: {
          id: matchId,
          stage: match.round,
          groupName: groupName,
          homeTeam: match.team1,
          awayTeam: match.team2,
          kickoff: kickoff,
          ground: match.ground,
          isCompleted: false,
        }
      });
      updatedCount++;
    }

    // Nollställ även allas poäng eftersom vi rensat allt
    await prisma.user.updateMany({
      data: { totalScore: 0 }
    });

    revalidatePath("/admin");
    revalidatePath("/bets");
    revalidatePath("/");
    
    return { success: true, count: updatedCount };
  } catch (error: any) {
    console.error("Sync error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateMatchResult(formData: FormData) {
  await requireAdmin();
  const matchId = formData.get("matchId") as string;
  const homeScoreRaw = formData.get("homeScore");
  const awayScoreRaw = formData.get("awayScore");
  const actualWinner = formData.get("actualWinner") as string | null;

  const homeScore = homeScoreRaw ? parseInt(homeScoreRaw as string, 10) : null;
  const awayScore = awayScoreRaw ? parseInt(awayScoreRaw as string, 10) : null;

  const isCompleted = homeScore !== null && awayScore !== null;

  const matchToUpdate = await prisma.match.findUnique({ where: { id: matchId } });
  
  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore,
      awayScore,
      actualWinner,
      isCompleted,
    },
  });

  if (isCompleted) {
    await calculatePointsForMatch(matchId);

    // Auto-fyll nästa runda i slutspelsträdet om vi har en vinnare
    if (actualWinner && matchToUpdate) {
      const loser = actualWinner === matchToUpdate.homeTeam ? matchToUpdate.awayTeam : matchToUpdate.homeTeam;
      
      const futureMatches = await prisma.match.findMany({
        where: {
          groupName: null,
          isCompleted: false,
          OR: [
            { homeTeam: { in: [`W${matchId}`, `L${matchId}`] } },
            { awayTeam: { in: [`W${matchId}`, `L${matchId}`] } }
          ]
        }
      });

      for (const futureMatch of futureMatches) {
        let newHome = futureMatch.homeTeam;
        let newAway = futureMatch.awayTeam;

        if (newHome === `W${matchId}`) newHome = actualWinner;
        if (newHome === `L${matchId}`) newHome = loser;
        if (newAway === `W${matchId}`) newAway = actualWinner;
        if (newAway === `L${matchId}`) newAway = loser;

        await prisma.match.update({
          where: { id: futureMatch.id },
          data: { homeTeam: newHome, awayTeam: newAway }
        });
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath("/"); // Uppdatera även leaderboarden
}

export async function updateKnockoutTeams(formData: FormData) {
  await requireAdmin();
  const matchId = formData.get("matchId") as string;
  const homeTeam = formData.get("homeTeam") as string;
  const awayTeam = formData.get("awayTeam") as string;

  if (!homeTeam || !awayTeam) {
    throw new Error("Båda lagen måste anges.");
  }

  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeTeam,
      awayTeam,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/bets");
  revalidatePath("/");
}



export async function finalizeGroupStandings(formData: FormData) {
  await requireAdmin();
  const groupName = formData.get("groupName") as string;
  const rank1 = formData.get("rank1") as string;
  const rank2 = formData.get("rank2") as string;
  const rank3 = formData.get("rank3") as string;
  const rank4 = formData.get("rank4") as string;

  const actualStandings = [
    { rank: 1, teamName: rank1 },
    { rank: 2, teamName: rank2 },
    { rank: 3, teamName: rank3 },
    { rank: 4, teamName: rank4 },
  ];

  await calculatePointsForGroup(groupName, actualStandings);

  // Spara officiella resultat i databasen för att kunna visa "Fastställd" i UI
  await prisma.officialGroupStanding.deleteMany({ where: { groupName } });
  await prisma.officialGroupStanding.createMany({
    data: actualStandings.map(s => ({
      groupName,
      teamName: s.teamName,
      rank: s.rank
    }))
  });

  // Auto-fyll slutspelsträdet för 1an och 2an i gruppen
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

    if (newHome === `1${groupName}`) newHome = rank1;
    if (newHome === `2${groupName}`) newHome = rank2;
    if (newAway === `1${groupName}`) newAway = rank1;
    if (newAway === `2${groupName}`) newAway = rank2;

    await prisma.match.update({
      where: { id: match.id },
      data: { homeTeam: newHome, awayTeam: newAway }
    });
  }

  revalidatePath("/admin");
  revalidatePath("/");
}
