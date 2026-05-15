'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Skapa en unik inbjudningskod (6 tecken, versaler och siffror)
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createLeague(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Not authenticated');

  const name = formData.get('name') as string;
  if (!name || name.length < 3) throw new Error('Namnet måste vara minst 3 tecken');

  let inviteCode = generateInviteCode();
  
  // Kontrollera att koden är unik (väldigt osannolikt men bra att ha)
  let existing = await prisma.league.findUnique({ where: { inviteCode } });
  while (existing) {
    inviteCode = generateInviteCode();
    existing = await prisma.league.findUnique({ where: { inviteCode } });
  }

  const league = await prisma.league.create({
    data: {
      name,
      inviteCode,
      adminId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
        },
      },
    },
  });

  revalidatePath('/leagues');
  return { success: true, leagueId: league.id };
}

export async function joinLeague(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Not authenticated');

  const inviteCode = (formData.get('inviteCode') as string)?.toUpperCase();
  if (!inviteCode) throw new Error('Inbjudningskod saknas');

  const league = await prisma.league.findUnique({
    where: { inviteCode },
    include: { members: true },
  });

  if (!league) throw new Error('Hittade ingen liga med den koden');

  const isAlreadyMember = league.members.some((m) => m.userId === session.user.id);
  if (isAlreadyMember) throw new Error('Du är redan med i den här ligan');

  await prisma.leagueMember.create({
    data: {
      userId: session.user.id,
      leagueId: league.id,
    },
  });

  revalidatePath('/leagues');
  return { success: true, leagueId: league.id };
}

export async function deleteLeague(leagueId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Not authenticated');

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
  });

  if (!league) throw new Error('Ligan hittades inte');
  if (league.adminId !== session.user.id) throw new Error('Endast admin kan ta bort ligan');

  await prisma.league.delete({
    where: { id: leagueId },
  });

  revalidatePath('/leagues');
  redirect('/leagues');
}

export async function leaveLeague(leagueId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Not authenticated');

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
  });

  if (!league) throw new Error('Ligan hittades inte');
  if (league.adminId === session.user.id) throw new Error('Som admin kan du inte lämna, du måste radera ligan istället');

  await prisma.leagueMember.delete({
    where: {
      userId_leagueId: {
        userId: session.user.id,
        leagueId: leagueId,
      },
    },
  });

  revalidatePath('/leagues');
  redirect('/leagues');
}

export async function sendLeagueComment(leagueId: string, content: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Not authenticated');

  if (!content || content.trim().length === 0) return;

  // Kontrollera medlemskap
  const membership = await prisma.leagueMember.findUnique({
    where: {
      userId_leagueId: {
        userId: session.user.id,
        leagueId: leagueId,
      },
    },
  });

  if (!membership) throw new Error('Du är inte medlem i denna liga');

  await prisma.leagueComment.create({
    data: {
      content,
      userId: session.user.id,
      leagueId: leagueId,
    },
  });

  revalidatePath(`/leagues/${leagueId}`);
}
