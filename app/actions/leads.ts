"use server";

import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Lead } from "@/models/lead";

const leadSchema = z.object({
  visitorId: z.string().trim().max(80),
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.email("Please enter a valid email address.").max(160),
  phone: z.string().trim().max(24).refine((value) => !value || /^[+()\d\s-]{7,24}$/.test(value), "Please enter a valid phone number."),
  company: z.string().trim().max(120),
  service: z.string().trim().max(80),
  message: z.string().trim().max(1500),
  source: z.enum(["chat-widget", "contact-form"]),
  pageUrl: z.string().trim().max(500).refine((value) => {
    if (!value) return true;
    try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
  }, "Invalid submission page."),
  website: z.string().trim().max(200),
});

export type LeadActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function createLeadAction(formData: FormData): Promise<LeadActionState> {
  const values = {
    visitorId: String(formData.get("visitorId") ?? ""),
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    company: String(formData.get("company") ?? ""),
    service: String(formData.get("service") ?? ""),
    message: String(formData.get("message") ?? ""),
    source: String(formData.get("source") ?? ""),
    pageUrl: String(formData.get("pageUrl") ?? ""),
    website: String(formData.get("website") ?? ""),
  };
  const parsed = leadSchema.safeParse(values);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  if (parsed.data.website) return { success: true };

  try {
    const { website: _honeypot, ...lead } = parsed.data;
    void _honeypot;
    await connectToDatabase();
    await Lead.create(lead);
    return { success: true, message: "Thanks — your details have been shared with our team." };
  } catch (error) {
    console.error("Lead creation failed", error);
    return { message: "We could not send your details. Please try again." };
  }
}
