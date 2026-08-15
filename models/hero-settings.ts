import "server-only";

import { Schema, deleteModel, model, models } from "mongoose";
import { heroAnimations, heroCtaTypes, heroLayouts } from "@/lib/hero-types";

const ctaSchema = new Schema({
  label: { type: String, trim: true, maxlength: 50, default: "" },
  type: { type: String, enum: heroCtaTypes, default: "none" },
  target: { type: String, trim: true, maxlength: 1000, default: "" },
  subject: { type: String, trim: true, maxlength: 160, default: "" },
  body: { type: String, maxlength: 2000, default: "" },
  newTab: { type: Boolean, default: false },
}, { _id: false });

const slideSchema = new Schema({
  slideId: { type: String, required: true, maxlength: 80 },
  layout: { type: String, enum: heroLayouts, default: "split-right" },
  eyebrow: { type: String, trim: true, maxlength: 80, default: "" },
  title: { type: String, trim: true, maxlength: 140, default: "" },
  accent: { type: String, trim: true, maxlength: 100, default: "" },
  subtitle: { type: String, trim: true, maxlength: 120, default: "" },
  description: { type: String, trim: true, maxlength: 420, default: "" },
  image: { type: Schema.Types.ObjectId, ref: "Media", default: null },
  imageAlt: { type: String, trim: true, maxlength: 180, default: "" },
  imagePosition: { type: String, enum: ["center", "top", "bottom", "left", "right"], default: "center" },
  imageOffsetX: { type: Number, min: -50, max: 50, default: 0 },
  imageOffsetY: { type: Number, min: -50, max: 50, default: 0 },
  customAnimation: { type: Boolean, default: false },
  enterAnimation: { type: String, enum: heroAnimations, default: "fade" },
  exitAnimation: { type: String, enum: heroAnimations, default: "fade" },
  primaryCta: { type: ctaSchema, default: () => ({}) },
  secondaryCta: { type: ctaSchema, default: () => ({}) },
}, { _id: false });

const heroSettingsSchema = new Schema({
  key: { type: String, unique: true, default: "homepage", immutable: true },
  autoplay: { type: Boolean, default: true },
  heroHeight: { type: Number, min: 520, max: 1000, default: 760 },
  interval: { type: Number, min: 2500, max: 30000, default: 6500 },
  transitionDuration: { type: Number, min: 200, max: 2000, default: 700 },
  pauseOnHover: { type: Boolean, default: true },
  showArrows: { type: Boolean, default: true },
  showDots: { type: Boolean, default: true },
  globalEnterAnimation: { type: String, enum: heroAnimations, default: "slide-left" },
  globalExitAnimation: { type: String, enum: heroAnimations, default: "fade" },
  slides: { type: [slideSchema], validate: [(value: unknown[]) => value.length >= 1 && value.length <= 10, "Use 1 to 10 slides."] },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  activeTemplateId: { type: String, default: null, index: true },
  activeTemplateRevision: { type: Number, min: 1, default: null },
}, { timestamps: true });

// Next.js keeps Mongoose models alive across development hot reloads. Recompile an
// older cached model when the hero schema gains fields, otherwise Mongoose's
// strict mode silently removes those fields while publishing a template.
if (models.HeroSettings && !models.HeroSettings.schema.path("heroHeight")) {
  deleteModel("HeroSettings");
}

export const HeroSettings = models.HeroSettings || model("HeroSettings", heroSettingsSchema);
