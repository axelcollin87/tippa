"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculatePointsForMatch, calculatePointsForGroup } from "@/lib/scoring";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { fetchWorldCupData } from "@/lib/openfootball";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.isAdmin) {
    throw new Error("Unauthorized");
  }
}

export async function syncWithGitHub() {
  await requireAdmin();
  
  try {
    const matches = await fetchWorldCupData();
    let updatedCount = 0;

    // Nollställ databasen (Tips och Matcher)
    await prisma.matchBet.deleteMany();
    await prisma.groupPlacementBet.deleteMany();
    await prisma.match.deleteMany();

    for (const match of matches) {
      // Skippa slutspelsträdet helt i detta skede (matcher utan grupp)
      if (!match.group) continue;

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

      // Extrahera gruppbokstav från "Group A" -> "A"
      const groupName = match.group.replace("Group ", "").trim();
      
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

  const homeScore = homeScoreRaw ? parseInt(homeScoreRaw as string, 10) : null;
  const awayScore = awayScoreRaw ? parseInt(awayScoreRaw as string, 10) : null;

  const isCompleted = homeScore !== null && awayScore !== null;

  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore,
      awayScore,
      isCompleted,
    },
  });

  if (isCompleted) {
    await calculatePointsForMatch(matchId);
  }

  revalidatePath("/admin");
  revalidatePath("/"); // Uppdatera även leaderboarden
}

export async function toggleGroupStageLock() {
  await requireAdmin();
  const config = await prisma.globalConfig.findUnique({ where: { id: "global" }});
  
  await prisma.globalConfig.update({
    where: { id: "global" },
    data: { groupStageLocked: !config?.groupStageLocked }
  });

  revalidatePath("/admin");
  revalidatePath("/bets");
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

  revalidatePath("/admin");
  revalidatePath("/");
}
