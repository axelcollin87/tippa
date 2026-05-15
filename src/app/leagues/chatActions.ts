'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';

export async function getLeagueComments(leagueId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Not authenticated');

  // Verify membership
  const membership = await prisma.leagueMember.findUnique({
    where: {
      userId_leagueId: {
        userId: session.user.id,
        leagueId: leagueId,
      },
    },
  });

  if (!membership) throw new Error('Not a member');

  const comments = await prisma.leagueComment.findMany({
    where: { leagueId },
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
    },
  });

  return comments;
}
