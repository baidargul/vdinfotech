"use client";

import { usePathname } from "next/navigation";
import type { WhatsAppSettingsData } from "@/lib/whatsapp-settings";

export function WhatsAppButton({ settings }: { settings: WhatsAppSettingsData }) {
  const pathname = usePathname();
  const isPublicPage = pathname === "/" || pathname.startsWith("/blog");
  if (!isPublicPage || !settings.enabled || !/^[6-9]\d{9}$/.test(settings.phoneNumber)) return null;

  const href = `https://wa.me/91${settings.phoneNumber}?text=${encodeURIComponent(settings.customMessage)}`;
  return (
    <a className="whatsapp-float" href={href} target="_blank" rel="noreferrer" aria-label="Chat with VD Infotech on WhatsApp" title="Chat with us on WhatsApp">
      <span className="whatsapp-logo" aria-hidden="true" />
    </a>
  );
}
