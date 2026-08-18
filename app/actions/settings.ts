"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import type { ContactWidgetSettingsData } from "@/lib/contact-widget-settings";
import { reviewTransitions, type ReviewSettingsData } from "@/lib/review-settings";
import { Media } from "@/models/media";
import { SiteSettings } from "@/models/site-settings";

const contactWidgetSettingsSchema = z.object({
  enabled: z.boolean(),
  kicker: z.string().trim().min(2, "Add a short intro label.").max(80),
  heading: z.string().trim().min(2, "Add a widget heading.").max(80),
  description: z.string().trim().min(10, "Description must contain at least 10 characters.").max(240),
  buttonLabel: z.string().trim().min(2, "Add a submit button label.").max(60),
});

export type ContactWidgetSettingsState = {
  success?: boolean;
  message?: string;
  errors?: Partial<Record<keyof ContactWidgetSettingsData, string[]>>;
  values?: ContactWidgetSettingsData;
};

export async function saveContactWidgetSettingsAction(
  _state: ContactWidgetSettingsState,
  formData: FormData,
): Promise<ContactWidgetSettingsState> {
  const user = await requireUser();
  const values: ContactWidgetSettingsData = {
    enabled: formData.get("enabled") === "on",
    kicker: String(formData.get("kicker") ?? "").trim(),
    heading: String(formData.get("heading") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    buttonLabel: String(formData.get("buttonLabel") ?? "").trim(),
  };
  const parsed = contactWidgetSettingsSchema.safeParse(values);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values };

  try {
    await connectToDatabase();
    await SiteSettings.findOneAndUpdate(
      { key: "website" },
      { $set: { contactWidget: parsed.data, updatedBy: user.id }, $setOnInsert: { key: "website" } },
      { upsert: true, runValidators: true },
    ).exec();
  } catch (error) {
    console.error("Contact widget settings save failed", error);
    return { message: "Contact widget settings could not be saved. Please try again.", values };
  }

  revalidatePath("/", "layout");
  return { success: true, message: "Contact widget saved and published.", values: parsed.data };
}

const whatsappSettingsSchema = z.object({
  enabled: z.boolean(),
  phoneNumber: z.string().trim(),
  customMessage: z.string().trim().max(500, "Message must contain at most 500 characters."),
}).superRefine((value, context) => {
  if (!value.enabled) return;
  if (!/^[6-9]\d{9}$/.test(value.phoneNumber)) {
    context.addIssue({ code: "custom", path: ["phoneNumber"], message: "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9." });
  }
  if (!value.customMessage) {
    context.addIssue({ code: "custom", path: ["customMessage"], message: "Enter the message visitors should send." });
  }
});

export type WhatsAppSettingsState = {
  success?: boolean;
  message?: string;
  errors?: { phoneNumber?: string[]; customMessage?: string[] };
  values?: { enabled: boolean; phoneNumber: string; customMessage: string };
};

export async function saveWhatsAppSettingsAction(
  _state: WhatsAppSettingsState,
  formData: FormData,
): Promise<WhatsAppSettingsState> {
  const user = await requireUser();
  const values = {
    enabled: formData.get("enabled") === "on",
    phoneNumber: String(formData.get("phoneNumber") ?? "").trim(),
    customMessage: String(formData.get("customMessage") ?? "").trim(),
  };
  const parsed = whatsappSettingsSchema.safeParse(values);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, values };
  }

  try {
    await connectToDatabase();
    await SiteSettings.findOneAndUpdate(
      { key: "website" },
      { $set: { whatsapp: parsed.data, updatedBy: user.id }, $setOnInsert: { key: "website" } },
      { upsert: true, runValidators: true },
    ).exec();
  } catch (error) {
    console.error("WhatsApp settings save failed", error);
    return { message: "WhatsApp settings could not be saved. Please try again.", values };
  }

  revalidatePath("/", "layout");
  return { success: true, message: "WhatsApp configuration saved and published.", values: parsed.data };
}

const reviewItemSchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(2, "Add the client name.").max(80),
  role: z.string().trim().min(2, "Add the client role or company.").max(120),
  quote: z.string().trim().min(10, "The main review must contain at least 10 characters.").max(1000),
  detail: z.string().trim().max(600),
  rating: z.number().int().min(1).max(5),
  imageId: z.string().trim().max(80),
  imageUrl: z.string().trim().max(250),
  imageAlt: z.string().trim().max(180),
});

const reviewSettingsSchema = z.object({
  autoplay: z.boolean(),
  interval: z.number().int().min(2000, "Duration must be at least 2 seconds.").max(30000, "Duration cannot exceed 30 seconds."),
  transition: z.enum(reviewTransitions),
  reviews: z.array(reviewItemSchema).min(1, "Add at least one review."),
});

export type ReviewSettingsState = {
  success?: boolean;
  message?: string;
  errors?: string[];
};

export async function saveReviewSettingsAction(
  _state: ReviewSettingsState,
  formData: FormData,
): Promise<ReviewSettingsState> {
  const user = await requireUser();
  let values: ReviewSettingsData;

  try {
    values = JSON.parse(String(formData.get("settings") ?? "")) as ReviewSettingsData;
  } catch {
    return { errors: ["The review configuration is invalid. Refresh the page and try again."] };
  }

  const parsed = reviewSettingsSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: parsed.error.issues.map((issue) => issue.message) };
  }

  try {
    await connectToDatabase();
    const imageIds = [...new Set(parsed.data.reviews.map((review) => review.imageId).filter(Boolean))];
    if (imageIds.some((id) => !Types.ObjectId.isValid(id))) {
      return { errors: ["One of the selected review images is invalid. Upload it again."] };
    }

    if (imageIds.length) {
      const ownedImages = await Media.countDocuments({
        _id: { $in: imageIds },
        owner: user.id,
        kind: "image",
        post: null,
      });
      if (ownedImages !== imageIds.length) {
        return { errors: ["One or more review images are unavailable. Upload them again."] };
      }
    }

    await SiteSettings.findOneAndUpdate(
      { key: "website" },
      {
        $set: {
          reviews: {
            autoplay: parsed.data.autoplay,
            interval: parsed.data.interval,
            transition: parsed.data.transition,
            items: parsed.data.reviews.map((review) => ({
              reviewId: review.id,
              name: review.name,
              role: review.role,
              quote: review.quote,
              detail: review.detail,
              rating: review.rating,
              image: review.imageId || null,
              imageAlt: review.imageAlt,
            })),
          },
          updatedBy: user.id,
        },
        $setOnInsert: { key: "website" },
      },
      { upsert: true, runValidators: true },
    ).exec();
  } catch (error) {
    console.error("Review settings save failed", error);
    return { message: "Reviews could not be saved. Please try again." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/settings");
  return { success: true, message: "Reviews saved and published." };
}
