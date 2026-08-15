import "server-only";

import { randomUUID } from "crypto";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { heroSettingsSchema } from "@/lib/hero-validation";
import { HeroTemplate } from "@/models/hero-template";
import type { HeroSettingsData, HeroTemplateActor, HeroTemplateFile } from "@/lib/hero-types";

const actorSchema = z.object({ id: z.string().min(1), name: z.string().min(1).max(80), email: z.string().email() });
const activitySchema = z.object({
  id: z.string().uuid(), action: z.enum(["created", "edited", "applied"]), revision: z.number().int().min(1), user: actorSchema, at: z.string().datetime(),
});
const templateSchema = z.object({
  schemaVersion: z.literal(1), id: z.string().uuid(), revision: z.number().int().min(1),
  name: z.string().trim().min(2).max(100), description: z.string().trim().max(500),
  createdBy: actorSchema, createdAt: z.string().datetime(), updatedBy: actorSchema, updatedAt: z.string().datetime(),
  lastAppliedBy: actorSchema.nullable(), lastAppliedAt: z.string().datetime().nullable(),
  carousel: heroSettingsSchema, activity: z.array(activitySchema).max(2000),
});

function assertId(id: string) {
  if (!z.string().uuid().safeParse(id).success) throw new Error("Template not found.");
  return id;
}

function parseTemplate(value: unknown): HeroTemplateFile {
  return templateSchema.parse(value);
}

export function templateActor(user: { id: string; name: string; email: string }): HeroTemplateActor {
  return { id: user.id, name: user.name, email: user.email };
}

export function canonicalCarousel(settings: HeroSettingsData): HeroSettingsData {
  return { ...structuredClone(settings), slides: settings.slides.map((slide) => ({ ...slide, imageUrl: "" })) };
}

export async function readHeroTemplate(id: string): Promise<HeroTemplateFile> {
  await connectToDatabase();
  const template = await HeroTemplate.findOne({ id: assertId(id) }).select("-_id").lean().exec();
  if (!template) throw new Error("Template not found.");
  return parseTemplate(template);
}

export async function listHeroTemplates(): Promise<HeroTemplateFile[]> {
  await connectToDatabase();
  const templates = await HeroTemplate.find({}).select("-_id").sort({ updatedAt: -1 }).lean().exec();
  return templates.map(parseTemplate);
}

export async function createHeroTemplate(input: { name: string; description: string; carousel: HeroSettingsData; user: HeroTemplateActor }) {
  const id = randomUUID(); const now = new Date().toISOString();
  const template = parseTemplate({ schemaVersion: 1, id, revision: 1, name: input.name, description: input.description, createdBy: input.user, createdAt: now, updatedBy: input.user, updatedAt: now, lastAppliedBy: null, lastAppliedAt: null, carousel: canonicalCarousel(input.carousel), activity: [{ id: randomUUID(), action: "created", revision: 1, user: input.user, at: now }] });
  await connectToDatabase();
  await HeroTemplate.create(template);
  return template;
}

export async function updateHeroTemplate(id: string, expectedRevision: number, input: { name: string; description: string; carousel: HeroSettingsData; user: HeroTemplateActor }) {
  const current = await readHeroTemplate(id);
  if (current.revision !== expectedRevision) throw new Error("This template was edited by someone else. Reload before saving again.");
  const now = new Date().toISOString(); const revision = current.revision + 1;
  const template = parseTemplate({ ...current, revision, name: input.name, description: input.description, updatedBy: input.user, updatedAt: now, carousel: canonicalCarousel(input.carousel), activity: [...current.activity, { id: randomUUID(), action: "edited", revision, user: input.user, at: now }] });
  const updated = await HeroTemplate.findOneAndReplace({ id: current.id, revision: expectedRevision }, template, { returnDocument: "after" }).select("-_id").lean().exec();
  if (!updated) throw new Error("This template was edited by someone else. Reload before saving again.");
  return parseTemplate(updated);
}

export async function applyHeroTemplate(id: string, expectedRevision: number, user: HeroTemplateActor, apply: (template: HeroTemplateFile) => Promise<void>) {
  const current = await readHeroTemplate(id);
  if (current.revision !== expectedRevision) throw new Error("This template changed. Reload it before applying.");
  await apply(current);
  const now = new Date().toISOString();
  const template = parseTemplate({ ...current, lastAppliedBy: user, lastAppliedAt: now, activity: [...current.activity, { id: randomUUID(), action: "applied", revision: current.revision, user, at: now }] });
  const updated = await HeroTemplate.findOneAndReplace({ id: current.id, revision: expectedRevision }, template, { returnDocument: "after" }).select("-_id").lean().exec();
  if (!updated) throw new Error("This template changed. Reload it before applying.");
  return parseTemplate(updated);
}

export async function deleteHeroTemplate(id: string) {
  await connectToDatabase();
  await HeroTemplate.deleteOne({ id: assertId(id) }).exec();
}

export async function referencedTemplateMediaIds(excludeTemplateId?: string) {
  const templates = await listHeroTemplates();
  return new Set(templates.filter((template) => template.id !== excludeTemplateId).flatMap((template) => template.carousel.slides.map((slide) => slide.imageId).filter(Boolean)));
}

export async function resolveTemplateMedia(template: HeroTemplateFile): Promise<HeroTemplateFile> {
  return { ...template, carousel: { ...template.carousel, slides: template.carousel.slides.map((slide) => ({ ...slide, imageUrl: slide.imageId ? `/media/${slide.imageId}` : "" })) } };
}
