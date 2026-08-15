"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { heroSettingsSchema } from "@/lib/hero-validation";
import { removeImage } from "@/lib/media-storage";
import { HeroSettings } from "@/models/hero-settings";
import { Media } from "@/models/media";
import { referencedTemplateMediaIds } from "@/lib/hero-template-storage";

export type HeroFormState = { success?: boolean; message?: string; errors?: string[] };

export async function saveHeroAction(_state: HeroFormState, formData: FormData): Promise<HeroFormState> {
  const user = await requireUser();
  let input: unknown;
  try { input = JSON.parse(String(formData.get("settings") || "")); }
  catch { return { message: "The carousel data could not be read." }; }
  const parsed = heroSettingsSchema.safeParse(input);
  if (!parsed.success) return { message: "Please correct the carousel settings.", errors: parsed.error.issues.map((issue) => issue.message) };

  const mediaIds = [...new Set(parsed.data.slides.map((slide) => slide.imageId).filter(Boolean))];
  if (mediaIds.some((id) => !Types.ObjectId.isValid(id))) return { message: "A selected image is invalid." };
  await connectToDatabase();
  const ownedMedia = mediaIds.length ? await Media.find({ _id: { $in: mediaIds }, owner: user.id, kind: "image", post: null }).select("_id").lean().exec() : [];
  if (ownedMedia.length !== mediaIds.length) return { message: "One or more images are unavailable or already attached elsewhere." };

  const previous = await HeroSettings.findOne({ key: "homepage" }).select("slides.image").lean().exec() as { slides: { image?: Types.ObjectId | null }[] } | null;
  const previousIds = previous?.slides.map((slide) => slide.image?.toString()).filter((id): id is string => Boolean(id)) ?? [];
  const templateMediaIds = await referencedTemplateMediaIds();
  const removedIds = previousIds.filter((id: string) => !mediaIds.includes(id) && !templateMediaIds.has(id));
  const values = {
    ...parsed.data,
    slides: parsed.data.slides.map(({ id, imageId, imageUrl, ...slide }) => {
      void imageUrl;
      return { ...slide, slideId: id, image: imageId || null };
    }),
    updatedBy: user.id,
    activeTemplateId: null,
    activeTemplateRevision: null,
  };
  await HeroSettings.findOneAndUpdate({ key: "homepage" }, { $set: values, $setOnInsert: { key: "homepage" } }, { upsert: true, runValidators: true, strict: false }).exec();
  if (removedIds.length) {
    const removed = await Media.find({ _id: { $in: removedIds }, owner: user.id, post: null }).select("storedName").lean().exec();
    await Promise.all(removed.map((media) => removeImage(media.storedName)));
    await Media.deleteMany({ _id: { $in: removedIds }, owner: user.id, post: null });
  }
  revalidatePath("/");
  revalidatePath("/dashboard/hero");
  return { success: true, message: "Hero carousel saved and published." };
}
