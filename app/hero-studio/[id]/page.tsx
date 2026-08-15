import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeroEditor } from "@/app/dashboard/hero/hero-editor";
import { readHeroTemplate, resolveTemplateMedia } from "@/lib/hero-template-storage";

export const metadata: Metadata = { title: "Edit Hero Template | VD Infotech" };

export default async function EditHeroTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let template;
  try {
    template = await resolveTemplateMedia(await readHeroTemplate(id));
  } catch { notFound(); }
  return <section className="hero-studio-content"><HeroEditor initialSettings={template.carousel} template={{ id: template.id, revision: template.revision, name: template.name, description: template.description, activity: template.activity }} /></section>;
}
