"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { heroSettingsSchema } from "@/lib/hero-validation";
import { applyHeroTemplate, createHeroTemplate, deleteHeroTemplate, readHeroTemplate, referencedTemplateMediaIds, templateActor, updateHeroTemplate } from "@/lib/hero-template-storage";
import { removeImage } from "@/lib/media-storage";
import { HeroSettings } from "@/models/hero-settings";
import { Media } from "@/models/media";
import type { HeroSettingsData } from "@/lib/hero-types";

const detailsSchema = z.object({ name: z.string().trim().min(2, "Template name is required.").max(100), description: z.string().trim().max(500) });
export type TemplateActionState = { success?: boolean; message?: string; errors?: string[] };

async function validateMedia(settings: HeroSettingsData) {
  const ids = [...new Set(settings.slides.map((slide) => slide.imageId).filter(Boolean))];
  if (ids.some((id) => !Types.ObjectId.isValid(id))) throw new Error("A selected image is invalid.");
  await connectToDatabase();
  const count = ids.length ? await Media.countDocuments({ _id: { $in: ids }, kind: "image" }) : 0;
  if (count !== ids.length) throw new Error("One or more template images are unavailable.");
  return ids;
}

async function removeOrphanedMedia(candidateIds: string[]) {
  if (!candidateIds.length) return;
  const templateIds = await referencedTemplateMediaIds();
  await connectToDatabase();
  const active = await HeroSettings.findOne({ key: "homepage" }).select("slides.image").lean().exec() as { slides?: { image?: Types.ObjectId | null }[] } | null;
  const activeIds = new Set(active?.slides?.map((slide) => slide.image?.toString()).filter((id): id is string => Boolean(id)) ?? []);
  const orphanIds = candidateIds.filter((id) => !templateIds.has(id) && !activeIds.has(id));
  if (!orphanIds.length) return;
  const media = await Media.find({ _id: { $in: orphanIds }, post: null }).select("storedName").lean().exec();
  await Promise.all(media.map((item) => removeImage(item.storedName)));
  await Media.deleteMany({ _id: { $in: orphanIds }, post: null });
}

function parsePayload(formData: FormData) {
  const details = detailsSchema.safeParse({ name: String(formData.get("name") || ""), description: String(formData.get("description") || "") });
  let carousel: unknown;
  try { carousel = JSON.parse(String(formData.get("settings") || "")); } catch { throw new Error("Template JSON could not be read."); }
  const settings = heroSettingsSchema.safeParse(carousel);
  if (!details.success || !settings.success) throw new Error([...(!details.success ? details.error.issues : []), ...(!settings.success ? settings.error.issues : [])].map((issue) => issue.message).join(" "));
  return { ...details.data, carousel: settings.data };
}

export async function createTemplateAction(_state: TemplateActionState, formData: FormData): Promise<TemplateActionState> {
  const user = await requireUser();
  try {
    const input = parsePayload(formData); await validateMedia(input.carousel);
    const template = await createHeroTemplate({ ...input, user: templateActor(user) });
    revalidatePath("/dashboard/hero"); redirect(`/hero-studio/${template.id}?created=1`);
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { message: error instanceof Error ? error.message : "Template could not be created." };
  }
}

export async function updateTemplateAction(_state: TemplateActionState, formData: FormData): Promise<TemplateActionState> {
  const user = await requireUser();
  const id = String(formData.get("templateId") || ""); const revision = Number(formData.get("revision"));
  try {
    const previous = await readHeroTemplate(id); const input = parsePayload(formData); await validateMedia(input.carousel);
    const template = await updateHeroTemplate(id, revision, { ...input, user: templateActor(user) });
    const retained = new Set(template.carousel.slides.map((slide) => slide.imageId).filter(Boolean));
    await removeOrphanedMedia(previous.carousel.slides.map((slide) => slide.imageId).filter((mediaId) => mediaId && !retained.has(mediaId)));
    revalidatePath("/dashboard/hero"); revalidatePath(`/hero-studio/${id}`);
    redirect(`/hero-studio/${id}?saved=${template.revision}`);
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { message: error instanceof Error ? error.message : "Template could not be saved." };
  }
}

export async function applyTemplateAction(_state: TemplateActionState, formData: FormData): Promise<TemplateActionState> {
  const user = await requireUser(); const id = String(formData.get("templateId") || ""); const revision = Number(formData.get("revision"));
  try {
    let mediaIds: string[] = []; let previousIds: string[] = [];
    await applyHeroTemplate(id, revision, templateActor(user), async (template) => {
      mediaIds = await validateMedia(template.carousel);
      await connectToDatabase();
      const values = { ...template.carousel, slides: template.carousel.slides.map(({ id: slideId, imageId, imageUrl, ...slide }) => { void imageUrl; return { ...slide, slideId, image: imageId || null }; }), updatedBy: user.id, activeTemplateId: template.id, activeTemplateRevision: template.revision };
      const previous = await HeroSettings.findOne({ key: "homepage" }).select("slides.image").lean().exec() as { slides?: { image?: Types.ObjectId | null }[] } | null;
      previousIds = previous?.slides?.map((slide) => slide.image?.toString()).filter((mediaId): mediaId is string => Boolean(mediaId)) ?? [];
      await HeroSettings.findOneAndUpdate({ key: "homepage" }, { $set: values, $setOnInsert: { key: "homepage" } }, { upsert: true, runValidators: true, strict: false }).exec();
    });
    await removeOrphanedMedia(previousIds.filter((mediaId) => !mediaIds.includes(mediaId)));
    revalidatePath("/"); revalidatePath("/dashboard/hero");
    return { success: true, message: "Template applied to the homepage." };
  } catch (error) { return { message: error instanceof Error ? error.message : "Template could not be applied." }; }
}

export async function deleteTemplateAction(_state: TemplateActionState, formData: FormData): Promise<TemplateActionState> {
  await requireUser(); const id = String(formData.get("templateId") || "");
  try {
    await connectToDatabase();
    if (await HeroSettings.exists({ key: "homepage", activeTemplateId: id })) throw new Error("Apply another template before deleting the active one.");
    const template = await readHeroTemplate(id); await deleteHeroTemplate(id);
    await removeOrphanedMedia(template.carousel.slides.map((slide) => slide.imageId).filter(Boolean));
    revalidatePath("/dashboard/hero");
    return { success: true, message: "Template deleted." };
  } catch (error) { return { message: error instanceof Error ? error.message : "Template could not be deleted." }; }
}
