import type { Metadata } from "next";
import { redirectIfAuthenticated } from "@/lib/auth";
import { AuthForm } from "../auth-form";
import { AuthShell } from "../auth-shell";

export const metadata: Metadata = {
  title: "Login | VD Infotech",
  description: "Sign in to your VD Infotech dashboard.",
};

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your workspace."
      description="Enter your account details to continue to the VD Infotech dashboard."
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
