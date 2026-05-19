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

  // Lås tipset 1 timme innan kickoff eller om matchen är avslutad
  const lockTime = new Date(match.kickoff.getTime() - 60 * 60 * 1000);
  if (match.isCompleted || new Date() > lockTime) {
    throw new Error(
      match.isCompleted 
        ? 'Matchen är redan avslutad.' 
        : 'Tipset är låst. Du måste spara ditt tips senast 1 timme innan matchstart.'
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
  if (match.isCompleted || new Date() > lockTime) {
    throw new Error(match.isCompleted ? 'Matchen är redan avslutad.' : 'Tipset är låst.');
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

export async function saveCrystalBallBet(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Du måste vara inloggad för att tippa.');

  const questionId = formData.get('questionId') as string;
  const answer = formData.get('answer') as string;

  if (!answer || answer.trim() === '') throw new Error('Svaret kan inte vara tomt.');

  const question = await prisma.sidebetQuestion.findUnique({ where: { id: questionId } });
  if (!question) throw new Error('Frågan finns inte.');

  const now = new Date();
  
  // Explicit blockering baserat på VM's första match
  const firstMatch = await prisma.match.findFirst({
    orderBy: { kickoff: 'asc' },
  });

  if (firstMatch && now >= firstMatch.kickoff) {
    throw new Error('Kristallkulan är låst eftersom turneringen har startat.');
  }

  // Backup: Om admin satt en specifik lockedAt som har passerats
  if (now > question.lockedAt) {
    throw new Error('Tiden för att svara på denna fråga har gått ut.');
  }

  await prisma.userSidebet.upsert({
    where: {
      userId_questionId: {
        userId: session.user.id,
        questionId: question.id,
      },
    },
    update: { answer: answer.trim() },
    create: {
      userId: session.user.id,
      questionId: question.id,
      answer: answer.trim(),
    },
  });

  revalidatePath('/bets');
}

export async function saveGroupPlacement(groupName: string, selectedTeams: string[]) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Du måste vara inloggad för att tippa.');

  // Enkel validering att man inte valt samma lag på flera placeringar
  const uniqueTeams = new Set(selectedTeams);
  if (uniqueTeams.size !== 4 || selectedTeams.includes('')) {
    throw new Error('Du måste välja 4 unika lag för gruppen.');
  }

  // Validera att lagen faktiskt tillhör gruppen
  const groupMatches = await prisma.match.findMany({
    where: { groupName: groupName },
    select: { homeTeam: true, awayTeam: true }
  });

  if (groupMatches.length === 0) {
    throw new Error('Gruppen hittades inte.');
  }

  const validTeamsForGroup = new Set<string>();
  groupMatches.forEach(match => {
    validTeamsForGroup.add(match.homeTeam);
    validTeamsForGroup.add(match.awayTeam);
  });

  for (const team of selectedTeams) {
    if (!validTeamsForGroup.has(team)) {
      throw new Error(`Laget ${team} tillhör inte Grupp ${groupName}.`);
    }
  }

  // Kolla låsning dynamiskt baserat på första match i gruppen
  const firstMatchInGroup = await prisma.match.findFirst({
    where: { groupName: groupName },
    orderBy: { kickoff: 'asc' },
  });

  if (firstMatchInGroup) {
    if (new Date() >= firstMatchInGroup.kickoff) {
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
