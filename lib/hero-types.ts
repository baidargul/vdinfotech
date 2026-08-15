export const heroAnimations = ["fade", "slide-left", "slide-right", "slide-up", "zoom", "flip"] as const;
export type HeroAnimation = (typeof heroAnimations)[number];

export const heroCtaTypes = ["none", "url", "section", "message", "email", "phone"] as const;
export type HeroCtaType = (typeof heroCtaTypes)[number];

export const heroLayouts = ["split-right", "split-left", "full-bleed", "overlay-left", "overlay-right", "centered-overlay", "stacked", "content-only", "image-only"] as const;
export type HeroLayout = (typeof heroLayouts)[number];

export type HeroCta = {
  label: string;
  type: HeroCtaType;
  target: string;
  subject: string;
  body: string;
  newTab: boolean;
};

export type HeroSlide = {
  id: string;
  layout: HeroLayout;
  eyebrow: string;
  title: string;
  accent: string;
  subtitle: string;
  description: string;
  imageId: string;
  imageUrl: string;
  imageAlt: string;
  imagePosition: "center" | "top" | "bottom" | "left" | "right";
  imageOffsetX: number;
  imageOffsetY: number;
  customAnimation: boolean;
  enterAnimation: HeroAnimation;
  exitAnimation: HeroAnimation;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
};

export type HeroSettingsData = {
  autoplay: boolean;
  heroHeight: number;
  interval: number;
  transitionDuration: number;
  pauseOnHover: boolean;
  showArrows: boolean;
  showDots: boolean;
  globalEnterAnimation: HeroAnimation;
  globalExitAnimation: HeroAnimation;
  slides: HeroSlide[];
};

export type HeroTemplateActor = { id: string; name: string; email: string };
export type HeroTemplateActivity = {
  id: string;
  action: "created" | "edited" | "applied";
  revision: number;
  user: HeroTemplateActor;
  at: string;
};

export type HeroTemplateFile = {
  schemaVersion: 1;
  id: string;
  revision: number;
  name: string;
  description: string;
  createdBy: HeroTemplateActor;
  createdAt: string;
  updatedBy: HeroTemplateActor;
  updatedAt: string;
  lastAppliedBy: HeroTemplateActor | null;
  lastAppliedAt: string | null;
  carousel: HeroSettingsData;
  activity: HeroTemplateActivity[];
};

export const emptyHeroCta = (): HeroCta => ({
  label: "",
  type: "none",
  target: "",
  subject: "",
  body: "",
  newTab: false,
});

export const defaultHeroSettings: HeroSettingsData = {
  autoplay: true,
  heroHeight: 760,
  interval: 6500,
  transitionDuration: 700,
  pauseOnHover: true,
  showArrows: true,
  showDots: true,
  globalEnterAnimation: "slide-left",
  globalExitAnimation: "fade",
  slides: [{
    id: "default-hero-slide",
    layout: "split-right",
    eyebrow: "Digital products, built with purpose",
    title: "We turn bold ideas into",
    accent: "remarkable software.",
    subtitle: "Ideas. Engineered.",
    description: "VD Infotech designs and engineers digital experiences that help modern businesses launch faster, work smarter, and grow with confidence.",
    imageId: "",
    imageUrl: "",
    imageAlt: "Abstract representation of connected digital products",
    imagePosition: "center",
    imageOffsetX: 0,
    imageOffsetY: 0,
    customAnimation: false,
    enterAnimation: "slide-left",
    exitAnimation: "fade",
    primaryCta: { ...emptyHeroCta(), label: "Start a project", type: "section", target: "contact" },
    secondaryCta: { ...emptyHeroCta(), label: "Explore our work", type: "section", target: "work" },
  }],
};

export function heroImageObjectPosition(slide: Pick<HeroSlide, "imagePosition" | "imageOffsetX" | "imageOffsetY">) {
  const anchors = { center: [50, 50], top: [50, 0], bottom: [50, 100], left: [0, 50], right: [100, 50] } as const;
  const [anchorX, anchorY] = anchors[slide.imagePosition];
  const x = Math.max(0, Math.min(100, anchorX + slide.imageOffsetX));
  const y = Math.max(0, Math.min(100, anchorY + slide.imageOffsetY));
  return `${x}% ${y}%`;
}
