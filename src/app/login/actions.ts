"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

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

  const hashedPassword = await bcrypt.hash(password, 10);

  // Om det är den allra första användaren i databasen, gör dem till Admin OCH godkänn dem direkt!
  const userCount = await prisma.user.count();
  const isFirstUser = userCount === 0;

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      isAdmin: isFirstUser,
      isApproved: isFirstUser, 
    }
  });

  if (isFirstUser) {
    return { success: true, message: "Konto skapat! Eftersom du är först blev du automatiskt Admin. Du kan logga in direkt." };
  }

  return { success: true, message: "Konto skapat! Du måste vänta på att en Admin godkänner ditt konto innan du kan logga in." };
}
