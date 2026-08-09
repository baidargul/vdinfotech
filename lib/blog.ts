import "server-only";

import sanitizeHtml from "sanitize-html";
import { Post } from "@/models/post";

export const POSTS_PER_PAGE = 9;

export function sanitizePostHtml(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [
      "p", "br", "h2", "h3", "h4", "strong", "em", "s", "blockquote",
      "ul", "ol", "li", "pre", "code", "a", "img", "hr",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "download"],
      img: ["src", "alt", "title"],
      code: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowedClasses: { code: ["language-*"] },
    transformTags: {
      a(_tagName, attribs) {
        const href = (attribs.href || "").trim();
        if (/^https?:\/\//i.test(href)) {
          return { tagName: "a", attribs: {
            href,
            ...(attribs.target === "_blank" ? { target: "_blank", rel: "noopener noreferrer" } : {}),
          } };
        }
        if (/^mailto:/i.test(href)) return { tagName: "a", attribs: { href } };
        if (/^\/(?!\/)/.test(href)) {
          return { tagName: "a", attribs: {
            href,
            ...(/^\/download\/[a-f0-9]{24}$/.test(href) ? { download: "" } : {}),
          } };
        }
        return { tagName: "a", attribs: {} };
      },
    },
    exclusiveFilter(frame) {
      if (frame.tag === "img") return !/^\/media\/[a-f0-9]{24}$/.test(frame.attribs.src || "");
      return frame.tag === "a" && !frame.attribs.href;
    },
  });
}

export function htmlToPlainText(value: string) {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

export function calculateReadingMinutes(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function normalizeTags(value: string | string[]) {
  const input = Array.isArray(value) ? value : value.split(",");
  return [...new Set(input.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 8);
}

export function extractMediaIds(value: string) {
  return [...value.matchAll(/\/(?:media|download)\/([a-f0-9]{24})/g)].map((match) => match[1]);
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "post";
}

export async function createUniqueSlug(title: string) {
  const base = slugify(title);
  let slug = base;
  let suffix = 2;

  while (await Post.exists({ slug })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export function publicPostFilter(now = new Date()) {
  return {
    status: "published",
    deletedAt: null,
    publishedAt: { $lte: now },
  };
}

export function postDisplayStatus(post: { status: string; publishedAt?: Date | null; deletedAt?: Date | null }) {
  if (post.deletedAt) return "Trashed";
  if (post.status === "draft") return "Draft";
  if (post.publishedAt && post.publishedAt > new Date()) return "Scheduled";
  return "Published";
}
