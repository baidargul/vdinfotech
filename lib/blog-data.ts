import "server-only";

import { cache } from "react";
import { connectToDatabase } from "@/lib/db";
import { publicPostFilter } from "@/lib/blog";
import { Post } from "@/models/post";

export type PublicPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  publishedAt: Date;
  readingMinutes: number;
  author: { id: string; name: string };
  cover: { id: string; altText: string } | null;
};

type PopulatedPost = {
  _id: { toString(): string };
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  category: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  publishedAt: Date;
  readingMinutes: number;
  author: { _id: { toString(): string }; name: string };
  coverMedia?: { _id: { toString(): string }; altText?: string } | null;
};

export function toPublicPost(post: PopulatedPost): PublicPost {
  return {
    id: post._id.toString(), title: post.title, slug: post.slug, excerpt: post.excerpt,
    contentHtml: post.contentHtml, category: post.category, tags: post.tags,
    seoTitle: post.seoTitle || "", seoDescription: post.seoDescription || "",
    publishedAt: post.publishedAt, readingMinutes: post.readingMinutes,
    author: { id: post.author._id.toString(), name: post.author.name },
    cover: post.coverMedia ? { id: post.coverMedia._id.toString(), altText: post.coverMedia.altText || "" } : null,
  };
}

export async function findPublishedPosts(filter: Record<string, unknown>, options: { skip?: number; limit?: number } = {}) {
  await connectToDatabase();
  const posts = await Post.find({ ...publicPostFilter(), ...filter })
    .populate("author", "name")
    .populate("coverMedia", "altText")
    .sort({ publishedAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 0)
    .lean<PopulatedPost[]>()
    .exec();
  return posts.filter((post) => post.author).map(toPublicPost);
}

export const getPublicPostBySlug = cache(async (slug: string) => {
  await connectToDatabase();
  const post = await Post.findOne({ ...publicPostFilter(), slug })
    .populate("author", "name")
    .populate("coverMedia", "altText")
    .lean<PopulatedPost>()
    .exec();
  return post?.author ? toPublicPost(post) : null;
});

export async function getLatestPosts(limit = 3) {
  return findPublishedPosts({}, { limit });
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://vdinfotech.com").replace(/\/$/, "");
}
