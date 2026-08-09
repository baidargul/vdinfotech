import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { getSession } from "@/lib/session";
import { User } from "@/models/user";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const session = await getSession();
  if (!session || !Types.ObjectId.isValid(session.userId)) return null;

  await connectToDatabase();
  const user = await User.findById(session.userId)
    .select("name email createdAt")
    .exec();

  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function redirectIfAuthenticated() {
  if (await getCurrentUser()) redirect("/dashboard");
}
