import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import { listHeroTemplates, resolveTemplateMedia } from "@/lib/hero-template-storage";
import { HeroSettings } from "@/models/hero-settings";
import { HeroTemplateLibrary } from "./template-library";

export const metadata: Metadata = { title: "Hero Templates | VD Infotech" };

export default async function HeroPage() {
  const templates = await Promise.all((await listHeroTemplates()).map(resolveTemplateMedia));
  await connectToDatabase();
  const active = await HeroSettings.findOne({ key: "homepage" }).select("activeTemplateId activeTemplateRevision").lean().exec() as { activeTemplateId?: string | null; activeTemplateRevision?: number | null } | null;
  return <section className="dashboard-content hero-template-page">
    <HeroTemplateLibrary templates={templates} activeTemplateId={active?.activeTemplateId || null} activeTemplateRevision={active?.activeTemplateRevision || null} />
  </section>;
}
