import "server-only";

import { connectToDatabase } from "@/lib/db";
import { defaultHeroSettings, type HeroSettingsData } from "@/lib/hero-types";
import { HeroSettings } from "@/models/hero-settings";
import type { HeroCta, HeroAnimation } from "@/lib/hero-types";

type StoredSlide = {
  slideId: string; eyebrow: string; title: string; accent: string; subtitle: string; description: string;
  layout?: HeroSettingsData["slides"][number]["layout"];
  image?: { toString(): string } | null; imageAlt: string; imagePosition: HeroSettingsData["slides"][number]["imagePosition"];
  imageOffsetX?: number; imageOffsetY?: number;
  customAnimation: boolean; enterAnimation: HeroAnimation; exitAnimation: HeroAnimation;
  primaryCta: HeroCta; secondaryCta: HeroCta;
};

type StoredHeroSettings = Omit<HeroSettingsData, "slides"> & { slides: StoredSlide[] };

export async function getHeroSettings(): Promise<HeroSettingsData> {
  await connectToDatabase();
  const settings = await HeroSettings.findOne({ key: "homepage" }).lean().exec() as StoredHeroSettings | null;
  if (!settings) return structuredClone(defaultHeroSettings);

  return {
    autoplay: settings.autoplay,
    heroHeight: settings.heroHeight || 760,
    interval: settings.interval,
    transitionDuration: settings.transitionDuration,
    pauseOnHover: settings.pauseOnHover,
    showArrows: settings.showArrows,
    showDots: settings.showDots,
    globalEnterAnimation: settings.globalEnterAnimation,
    globalExitAnimation: settings.globalExitAnimation,
    slides: settings.slides.map((slide) => ({
      id: slide.slideId,
      layout: slide.layout || "split-right",
      eyebrow: slide.eyebrow,
      title: slide.title,
      accent: slide.accent,
      subtitle: slide.subtitle,
      description: slide.description,
      imageId: slide.image?.toString() || "",
      imageUrl: slide.image ? `/media/${slide.image.toString()}` : "",
      imageAlt: slide.imageAlt,
      imagePosition: slide.imagePosition,
      imageOffsetX: slide.imageOffsetX ?? 0,
      imageOffsetY: slide.imageOffsetY ?? 0,
      customAnimation: slide.customAnimation,
      enterAnimation: slide.enterAnimation,
      exitAnimation: slide.exitAnimation,
      primaryCta: { ...slide.primaryCta },
      secondaryCta: { ...slide.secondaryCta },
    })),
  } as HeroSettingsData;
}
