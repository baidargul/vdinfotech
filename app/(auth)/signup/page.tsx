import type { Metadata } from "next";
import { redirectIfAuthenticated } from "@/lib/auth";
import { AuthForm } from "../auth-form";
import { AuthShell } from "../auth-shell";

export const metadata: Metadata = {
  title: "Create Account | VD Infotech",
  description: "Create your VD Infotech dashboard account.",
};

export default async function SignupPage() {
  await redirectIfAuthenticated();

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your workspace account."
      description="Set up your secure account and continue directly to your dashboard."
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
