import "server-only";

import { randomUUID } from "crypto";
import { mkdir, open, readFile, readdir, rename, rm, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { heroSettingsSchema } from "@/lib/hero-validation";
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

function storageDirectory() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.HERO_TEMPLATE_DIR || path.join(process.cwd(), "storage", "hero-templates"));
}

function assertId(id: string) {
  if (!z.string().uuid().safeParse(id).success) throw new Error("Template not found.");
  return id;
}

function templatePath(id: string) { return path.join(storageDirectory(), `${assertId(id)}.json`); }
function lockPath(id: string) { return path.join(storageDirectory(), `${assertId(id)}.lock`); }

async function atomicWrite(template: HeroTemplateFile) {
  await mkdir(storageDirectory(), { recursive: true });
  const target = templatePath(template.id);
  const temporary = path.join(storageDirectory(), `.${template.id}.${randomUUID()}.tmp`);
  await writeFile(temporary, `${JSON.stringify(template, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  await rename(temporary, target);
}

async function withLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
  await mkdir(storageDirectory(), { recursive: true });
  const target = lockPath(id);
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try { handle = await open(target, "wx"); break; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const info = await stat(target).catch(() => null);
      if (info && Date.now() - info.mtimeMs > 30_000) await unlink(target).catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 50 + attempt * 10));
    }
  }
  if (!handle) throw new Error("Template is busy. Please try again.");
  try { return await operation(); }
  finally { await handle.close(); await unlink(target).catch(() => undefined); }
}

export function templateActor(user: { id: string; name: string; email: string }): HeroTemplateActor {
  return { id: user.id, name: user.name, email: user.email };
}

export function canonicalCarousel(settings: HeroSettingsData): HeroSettingsData {
  return { ...structuredClone(settings), slides: settings.slides.map((slide) => ({ ...slide, imageUrl: "" })) };
}

export async function readHeroTemplate(id: string): Promise<HeroTemplateFile> {
  let source: string;
  try { source = await readFile(templatePath(id), "utf8"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new Error("Template not found."); throw error; }
  return templateSchema.parse(JSON.parse(source));
}

export async function listHeroTemplates(): Promise<HeroTemplateFile[]> {
  await mkdir(storageDirectory(), { recursive: true });
  const names = (await readdir(storageDirectory())).filter((name) => /^[0-9a-f-]{36}\.json$/i.test(name));
  const results = await Promise.all(names.map(async (name) => {
    try { return await readHeroTemplate(name.slice(0, -5)); } catch { return null; }
  }));
  return results.filter((item): item is HeroTemplateFile => Boolean(item)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createHeroTemplate(input: { name: string; description: string; carousel: HeroSettingsData; user: HeroTemplateActor }) {
  const id = randomUUID(); const now = new Date().toISOString();
  return withLock(id, async () => {
    const template = templateSchema.parse({ schemaVersion: 1, id, revision: 1, name: input.name, description: input.description, createdBy: input.user, createdAt: now, updatedBy: input.user, updatedAt: now, lastAppliedBy: null, lastAppliedAt: null, carousel: canonicalCarousel(input.carousel), activity: [{ id: randomUUID(), action: "created", revision: 1, user: input.user, at: now }] });
    await atomicWrite(template); return template;
  });
}

export async function updateHeroTemplate(id: string, expectedRevision: number, input: { name: string; description: string; carousel: HeroSettingsData; user: HeroTemplateActor }) {
  return withLock(id, async () => {
    const current = await readHeroTemplate(id);
    if (current.revision !== expectedRevision) throw new Error("This template was edited by someone else. Reload before saving again.");
    const now = new Date().toISOString(); const revision = current.revision + 1;
    const template = templateSchema.parse({ ...current, revision, name: input.name, description: input.description, updatedBy: input.user, updatedAt: now, carousel: canonicalCarousel(input.carousel), activity: [...current.activity, { id: randomUUID(), action: "edited", revision, user: input.user, at: now }] });
    await atomicWrite(template); return template;
  });
}

export async function applyHeroTemplate(id: string, expectedRevision: number, user: HeroTemplateActor, apply: (template: HeroTemplateFile) => Promise<void>) {
  return withLock(id, async () => {
    const current = await readHeroTemplate(id);
    if (current.revision !== expectedRevision) throw new Error("This template changed. Reload it before applying.");
    await apply(current);
    const now = new Date().toISOString();
    const template = templateSchema.parse({ ...current, lastAppliedBy: user, lastAppliedAt: now, activity: [...current.activity, { id: randomUUID(), action: "applied", revision: current.revision, user, at: now }] });
    await atomicWrite(template); return template;
  });
}

export async function deleteHeroTemplate(id: string) {
  return withLock(id, async () => { await rm(templatePath(id), { force: true }); });
}

export async function referencedTemplateMediaIds(excludeTemplateId?: string) {
  const templates = await listHeroTemplates();
  return new Set(templates.filter((template) => template.id !== excludeTemplateId).flatMap((template) => template.carousel.slides.map((slide) => slide.imageId).filter(Boolean)));
}

export async function resolveTemplateMedia(template: HeroTemplateFile): Promise<HeroTemplateFile> {
  return { ...template, carousel: { ...template.carousel, slides: template.carousel.slides.map((slide) => ({ ...slide, imageUrl: slide.imageId ? `/media/${slide.imageId}` : "" })) } };
}
