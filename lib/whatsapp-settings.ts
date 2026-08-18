import "server-only";

import { connectToDatabase } from "@/lib/db";
import { SiteSettings } from "@/models/site-settings";

export type WhatsAppSettingsData = {
  enabled: boolean;
  phoneNumber: string;
  customMessage: string;
};

export const defaultWhatsAppSettings: WhatsAppSettingsData = {
  enabled: false,
  phoneNumber: "",
  customMessage: "Hello VD Infotech, I would like to discuss a project.",
};

export async function getWhatsAppSettings(): Promise<WhatsAppSettingsData> {
  await connectToDatabase();
  const settings = await SiteSettings.findOne({ key: "website" })
    .select("whatsapp")
    .lean()
    .exec() as { whatsapp?: Partial<WhatsAppSettingsData> } | null;

  return {
    enabled: settings?.whatsapp?.enabled ?? defaultWhatsAppSettings.enabled,
    phoneNumber: settings?.whatsapp?.phoneNumber ?? defaultWhatsAppSettings.phoneNumber,
    customMessage: settings?.whatsapp?.customMessage ?? defaultWhatsAppSettings.customMessage,
  };
}
