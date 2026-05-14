"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.isAdmin) {
    throw new Error("Unauthorized");
  }
}

export async function approveUser(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId") as string;
  
  await prisma.user.update({
    where: { id: userId },
    data: { isApproved: true }
  });
  
  revalidatePath("/admin");
}

export async function deleteUser(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId") as string;
  
  // Ta först bort användarens alla tips för att undvika foreign key errors
  await prisma.matchBet.deleteMany({ where: { userId } });
  await prisma.groupPlacementBet.deleteMany({ where: { userId } });
  
  await prisma.user.delete({
    where: { id: userId }
  });
  
  revalidatePath("/admin");
}
