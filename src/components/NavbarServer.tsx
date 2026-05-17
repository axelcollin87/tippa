import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Navbar from "./Navbar";

export default async function NavbarServer() {
  const session = await getServerSession(authOptions);

  let missingBetsCount = 0;

  if (session?.user?.id) {
    const allMatches = await prisma.match.findMany({
       select: { id: true, kickoff: true, isCompleted: true, groupName: true, stage: true }
    });
    const userBets = await prisma.matchBet.findMany({
       where: { userId: session.user.id },
       select: { matchId: true }
    });
    
    const now = new Date();
    const anyGroupMatchesLeft = allMatches.some(m => m.groupName && !m.isCompleted);
    
    missingBetsCount = allMatches.filter((m) => {
      const isMissing = !userBets.some((b) => b.matchId === m.id);
      const lockTime = new Date(m.kickoff.getTime() - 60 * 60 * 1000);
      const isBettable = lockTime > now;
      const isNotCompleted = !m.isCompleted;

      if (!isMissing || !isBettable || !isNotCompleted) return false;

      if (anyGroupMatchesLeft) {
        return !!m.groupName;
      }

      const firstUpcomingKnockout = allMatches
        .filter((km) => !km.groupName && !km.isCompleted)
        .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime())[0];

      if (firstUpcomingKnockout) {
        if (firstUpcomingKnockout.stage === '3rd Place' || firstUpcomingKnockout.stage === 'Final') {
          return m.stage === '3rd Place' || m.stage === 'Final';
        }
        return m.stage === firstUpcomingKnockout.stage;
      }

      return true;
    }).length;
  }

  return <Navbar missingBetsCount={missingBetsCount} />;
}
