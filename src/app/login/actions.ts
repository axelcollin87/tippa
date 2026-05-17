"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const honeypot = formData.get("website_url") as string; // Honeypot field

  // Bot-skydd: Om honeypot-fältet är ifyllt är det antagligen en bot
  if (honeypot) {
    // Låtsas som att det gick bra för att inte ge botar ledtrådar
    return { success: true, message: "Konto skapat. Loggar in..." };
  }

  if (!name || !email || !password) {
    return { error: "Alla fält måste fyllas i." };
  }

  if (password.length < 6) {
    return { error: "Lösenordet måste vara minst 6 tecken." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return { error: "Denna e-postadress är redan registrerad." };
  }

  // Kolla om namnet (nickname) redan är taget
  const existingName = await prisma.user.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } }
  });

  if (existingName) {
    return { error: "Detta namn är redan taget, vänligen välj ett annat." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const userCount = await prisma.user.count();
  const isFirstUser = userCount === 0;

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      isAdmin: isFirstUser,
      isApproved: true, // Alla godkänns direkt nu
    }
  });

  return { success: true, message: "Konto skapat! Loggar in dig..." };
}
