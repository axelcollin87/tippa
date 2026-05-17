'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return { error: 'Du måste vara inloggad' };
  }

  const name = formData.get('name') as string;
  if (!name || name.trim().length < 2) {
    return { error: 'Namnet måste vara minst 2 tecken långt' };
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { name: name.trim() },
    });

    revalidatePath('/profile');
    revalidatePath('/');
    return { success: 'Namnet har uppdaterats' };
  } catch (error) {
    console.error('Update profile error:', error);
    return { error: 'Kunde inte uppdatera profil' };
  }
}

export async function updatePassword(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return { error: 'Du måste vara inloggad' };
  }

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (newPassword !== confirmPassword) {
    return { error: 'De nya lösenorden matchar inte' };
  }

  if (newPassword.length < 6) {
    return { error: 'Det nya lösenordet måste vara minst 6 tecken' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { error: 'Användaren hittades inte' };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return { error: 'Nuvarande lösenord är felaktigt' };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashedNewPassword },
    });

    return { success: 'Lösenordet har uppdaterats' };
  } catch (error) {
    console.error('Update password error:', error);
    return { error: 'Kunde inte uppdatera lösenord' };
  }
}
