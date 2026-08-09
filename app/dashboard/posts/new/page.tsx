import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PostEditor } from "../post-editor";

export const metadata: Metadata = { title: "New Post | VD Infotech" };

export default async function NewPostPage() {
  await requireUser();
  return <section className="dashboard-content dashboard-editor-page"><PostEditor /></section>;
}
