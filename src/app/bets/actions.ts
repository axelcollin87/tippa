'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

export async function saveBet(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Du måste vara inloggad för att tippa.');

  const matchId = formData.get('matchId') as string;
  const predictedSign = formData.get('predictedSign') as string;

  if (predictedSign && !['1', 'X', '2'].includes(predictedSign)) {
    throw new Error('Ogiltigt tips.');
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) throw new Error('Matchen hittades inte.');

  // Lås tipset 1 timme innan kickoff
  const lockTime = new Date(match.kickoff.getTime() - 60 * 60 * 1000);
  if (new Date() > lockTime) {
    throw new Error(
      'Tipset är låst. Du måste spara ditt tips senast 1 timme innan matchstart.'
    );
  }

  if (predictedSign) {
    await prisma.matchBet.upsert({
      where: {
        userId_matchId: {
          userId: session.user.id,
          matchId: matchId,
        },
      },
      update: {
        predictedSign: predictedSign,
      },
      create: {
        userId: session.user.id,
        matchId: matchId,
        predictedSign: predictedSign,
      },
    });
  }

  revalidatePath('/bets');
  revalidatePath('/');
}

export async function saveProgressBet(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Du måste vara inloggad för att tippa.');

  const matchId = formData.get('matchId') as string;
  const predictedWinner = formData.get('predictedWinner') as string;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) throw new Error('Matchen hittades inte.');
  if (match.stage === 'Group') throw new Error('Kan inte spara avancemang i gruppspel.');

  // Validera att vinnaren är ett av lagen i matchen
  if (predictedWinner !== match.homeTeam && predictedWinner !== match.awayTeam) {
    throw new Error('Ogiltigt lag valt som vinnare.');
  }

  const lockTime = new Date(match.kickoff.getTime() - 60 * 60 * 1000);
  if (new Date() > lockTime) {
    throw new Error('Tipset är låst.');
  }

  await prisma.matchBet.upsert({
    where: {
      userId_matchId: {
        userId: session.user.id,
        matchId: matchId,
      },
    },
    update: {
      predictedWinner: predictedWinner,
    },
    create: {
      userId: session.user.id,
      matchId: matchId,
      predictedSign: 'X', // Standardvärde om de inte tippat 1X2 än
      predictedWinner: predictedWinner,
    },
  });

  revalidatePath('/bets');
}

export async function saveGroupPlacement(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Du måste vara inloggad för att tippa.');

  const groupName = formData.get('groupName') as string;
  const rank1 = formData.get('rank1') as string;
  const rank2 = formData.get('rank2') as string;
  const rank3 = formData.get('rank3') as string;
  const rank4 = formData.get('rank4') as string;

  const selectedTeams = [rank1, rank2, rank3, rank4];

  // Enkel validering att man inte valt samma lag på flera placeringar
  const uniqueTeams = new Set(selectedTeams);
  if (uniqueTeams.size !== 4 || selectedTeams.includes('')) {
    throw new Error('Du måste välja 4 unika lag för gruppen.');
  }

  // Kolla låsning dynamiskt baserat på första match i gruppen
  const firstMatchInGroup = await prisma.match.findFirst({
    where: { groupName: groupName },
    orderBy: { kickoff: 'asc' },
  });

  if (firstMatchInGroup) {
    const lockTime = new Date(firstMatchInGroup.kickoff.getTime() - 60 * 60 * 1000); // 1 timme före kickoff
    if (new Date() > lockTime) {
      throw new Error('Gruppen är låst för tippning då dess matcher har startat!');
    }
  }

  // Vi raderar användarens gamla tips för denna grupp för att skriva om dem
  await prisma.groupPlacementBet.deleteMany({
    where: {
      userId: session.user.id,
      groupName: groupName,
    },
  });

  // Skapa de 4 nya rankningarna
  const placements = selectedTeams.map((team, index) => ({
    userId: session.user.id,
    groupName: groupName,
    teamName: team,
    predictedRank: index + 1, // 1, 2, 3, 4
  }));

  await prisma.groupPlacementBet.createMany({
    data: placements,
  });

  revalidatePath('/bets');
}
