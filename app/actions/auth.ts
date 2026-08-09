"use server";

import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import {
  assertSessionConfigured,
  createSession,
  deleteSession,
} from "@/lib/session";
import { User } from "@/models/user";

const emailField = z
  .string()
  .trim()
  .max(254, "Email address is too long.")
  .email("Enter a valid email address.")
  .transform((email) => email.toLowerCase());

const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters.")
    .max(80, "Name must contain at most 80 characters."),
  email: emailField,
  password: z
    .string()
    .min(8, "Password must contain at least 8 characters.")
    .max(72, "Password must contain at most 72 characters."),
});

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password.").max(72),
});

export type AuthFormState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string;
  values?: {
    name?: string;
    email?: string;
  };
};

const DUMMY_PASSWORD_HASH =
  "$2b$12$uUr4ZjmEowUPPQQDLPbF0ucy/8NIhViDuSP14ip0rzfv7d6Ct2esO";

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function signupAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = signupSchema.safeParse(values);

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      values: { name: values.name, email: values.email },
    };
  }

  let userId: string;
  try {
    assertSessionConfigured();
    await connectToDatabase();

    const existingUser = await User.exists({ email: parsed.data.email });
    if (existingUser) {
      return {
        errors: { email: ["An account with this email already exists."] },
        values: { name: parsed.data.name, email: parsed.data.email },
      };
    }

    const passwordHash = await hash(parsed.data.password, 12);
    const user = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    });
    userId = user._id.toString();
    await createSession(userId);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return {
        errors: { email: ["An account with this email already exists."] },
        values: { name: parsed.data.name, email: parsed.data.email },
      };
    }

    console.error("Signup failed", error);
    return {
      message: "Account creation is temporarily unavailable. Please try again.",
      values: { name: parsed.data.name, email: parsed.data.email },
    };
  }

  redirect("/dashboard");
}

export async function loginAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      values: { email: values.email },
    };
  }

  try {
    assertSessionConfigured();
    await connectToDatabase();
    const user = await User.findOne({ email: parsed.data.email })
      .select("+passwordHash")
      .exec();
    const passwordMatches = await compare(
      parsed.data.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordMatches) {
      return {
        message: "Email or password is incorrect.",
        values: { email: parsed.data.email },
      };
    }

    await createSession(user._id.toString());
  } catch (error) {
    console.error("Login failed", error);
    return {
      message: "Login is temporarily unavailable. Please try again.",
      values: { email: parsed.data.email },
    };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
