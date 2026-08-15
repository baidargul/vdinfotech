import { z } from "zod";
import { heroAnimations, heroCtaTypes, heroLayouts } from "@/lib/hero-types";

export const heroCtaSchema = z.object({
  label: z.string().trim().max(50),
  type: z.enum(heroCtaTypes),
  target: z.string().trim().max(1000),
  subject: z.string().trim().max(160),
  body: z.string().max(2000),
  newTab: z.boolean(),
}).superRefine((cta, context) => {
  if (cta.type === "none" || !cta.label) return;
  if (!cta.target && cta.type !== "message") context.addIssue({ code: "custom", message: "CTA target is required." });
  if (cta.type === "message" && !cta.body.trim()) context.addIssue({ code: "custom", message: "CTA message is required." });
  if (cta.type === "url" && !/^(https?:\/\/|\/)(?!\/)/i.test(cta.target)) context.addIssue({ code: "custom", message: "Use an internal path or an http(s) URL." });
  if (cta.type === "email" && !z.string().email().safeParse(cta.target).success) context.addIssue({ code: "custom", message: "Enter a valid email address." });
  if (cta.type === "section" && !/^[a-z][\w-]*$/i.test(cta.target.replace(/^#/, ""))) context.addIssue({ code: "custom", message: "Enter a valid section ID." });
});

export const heroSettingsSchema = z.object({
  autoplay: z.boolean(),
  heroHeight: z.number().int().min(520).max(1000).default(760),
  interval: z.number().int().min(2500).max(30000),
  transitionDuration: z.number().int().min(200).max(2000),
  pauseOnHover: z.boolean(),
  showArrows: z.boolean(),
  showDots: z.boolean(),
  globalEnterAnimation: z.enum(heroAnimations),
  globalExitAnimation: z.enum(heroAnimations),
  slides: z.array(z.object({
    id: z.string().min(1).max(80),
    layout: z.enum(heroLayouts).default("split-right"),
    eyebrow: z.string().trim().max(80),
    title: z.string().trim().max(140),
    accent: z.string().trim().max(100),
    subtitle: z.string().trim().max(120),
    description: z.string().trim().max(420),
    imageId: z.string(),
    imageUrl: z.string(),
    imageAlt: z.string().trim().max(180),
    imagePosition: z.enum(["center", "top", "bottom", "left", "right"]),
    imageOffsetX: z.number().int().min(-50).max(50).default(0),
    imageOffsetY: z.number().int().min(-50).max(50).default(0),
    customAnimation: z.boolean(),
    enterAnimation: z.enum(heroAnimations),
    exitAnimation: z.enum(heroAnimations),
    primaryCta: heroCtaSchema,
    secondaryCta: heroCtaSchema,
  }).refine((slide) => slide.title || slide.subtitle || slide.description || slide.imageId, "Each slide needs content or an image."))
    .min(1, "Add at least one slide.")
    .max(10, "A maximum of 10 slides is supported."),
});
