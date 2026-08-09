import { requireUser } from "@/lib/auth";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
