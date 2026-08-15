import type { Metadata } from "next";
import { defaultHeroSettings, emptyHeroCta, type HeroSettingsData } from "@/lib/hero-types";
import { HeroEditor } from "@/app/dashboard/hero/hero-editor";

export const metadata: Metadata = { title: "Create Hero Template | VD Infotech" };

const blankSettings: HeroSettingsData = {
  ...defaultHeroSettings,
  slides: [{
    id: "starter-slide", layout: "split-right", eyebrow: "", title: "New slide title", accent: "", subtitle: "", description: "Add your hero message here.",
    imageId: "", imageUrl: "", imageAlt: "", imagePosition: "center", imageOffsetX: 0, imageOffsetY: 0, customAnimation: false,
    enterAnimation: "fade", exitAnimation: "fade", primaryCta: emptyHeroCta(), secondaryCta: emptyHeroCta(),
  }],
};

export default function NewHeroTemplatePage() {
  return <section className="hero-studio-content"><HeroEditor initialSettings={blankSettings} /></section>;
}
