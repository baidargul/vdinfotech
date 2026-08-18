import "server-only";

import { connectToDatabase } from "@/lib/db";
import { SiteSettings } from "@/models/site-settings";

export type ContactWidgetSettingsData = {
  enabled: boolean;
  kicker: string;
  heading: string;
  description: string;
  buttonLabel: string;
};

export const defaultContactWidgetSettings: ContactWidgetSettingsData = {
  enabled: true,
  kicker: "Let's build something useful",
  heading: "Hi there",
  description: "Share a few details and our team will get back to you shortly.",
  buttonLabel: "Start a conversation",
};

export async function getContactWidgetSettings(): Promise<ContactWidgetSettingsData> {
  await connectToDatabase();
  const settings = await SiteSettings.findOne({ key: "website" })
    .select("contactWidget")
    .lean()
    .exec() as { contactWidget?: Partial<ContactWidgetSettingsData> } | null;

  return {
    enabled: settings?.contactWidget?.enabled ?? defaultContactWidgetSettings.enabled,
    kicker: settings?.contactWidget?.kicker || defaultContactWidgetSettings.kicker,
    heading: settings?.contactWidget?.heading || defaultContactWidgetSettings.heading,
    description: settings?.contactWidget?.description || defaultContactWidgetSettings.description,
    buttonLabel: settings?.contactWidget?.buttonLabel || defaultContactWidgetSettings.buttonLabel,
  };
}
