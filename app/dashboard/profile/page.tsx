import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile | VD Infotech" };

export default async function ProfilePage() {
  const user = await requireUser();
  return <section className="dashboard-content dashboard-profile-page"><div className="manager-heading"><div><p className="eyebrow"><span /> Your account</p><h1>Profile</h1><p>Your public author identity and workspace access.</p></div></div><div className="dashboard-card profile-details-card"><span className="profile-avatar">{user.name.charAt(0).toUpperCase()}</span><div><span>Full name</span><strong>{user.name}</strong></div><div><span>Email address</span><strong>{user.email}</strong></div><div><span>Member since</span><strong>{new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(user.createdAt)}</strong></div><div><span>Publishing access</span><strong>Author · Own posts</strong></div></div></section>;
}
