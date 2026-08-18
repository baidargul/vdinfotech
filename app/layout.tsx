import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { getContactWidgetSettings } from "@/lib/contact-widget-settings";
import { getWhatsAppSettings } from "@/lib/whatsapp-settings";
import { WhatsAppButton } from "./whatsapp-button";
import { LeadWidget } from "./lead-widget";
import "./globals.css";

const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"] });
const display = Playfair_Display({ variable: "--font-display", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://vdinfotech.com"),
  title: "VD Infotech | Digital Products, Built with Purpose",
  description: "VD Infotech designs and engineers high-performing websites, mobile apps, cloud platforms, and digital products for ambitious businesses.",
  openGraph: {
    title: "VD Infotech | Ideas. Engineered.",
    description: "Strategy, design, and engineering for digital products that move businesses forward.",
    type: "website",
    locale: "en_US",
    siteName: "VD Infotech",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [contactWidgetSettings, whatsappSettings] = await Promise.all([getContactWidgetSettings(), getWhatsAppSettings()]);
  return <html lang="en" className={`${sans.variable} ${display.variable}`}><body>{children}<LeadWidget settings={contactWidgetSettings} /><WhatsAppButton settings={whatsappSettings} /></body></html>;
}
