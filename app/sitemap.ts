import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db";
import { publicPostFilter } from "@/lib/blog";
import { siteUrl } from "@/lib/blog-data";
import { Post } from "@/models/post";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.8 },
  ];

  try {
    await connectToDatabase();
    const posts = await Post.find(publicPostFilter()).select("slug updatedAt").lean().exec();
    return [...staticRoutes, ...posts.map((post) => ({ url: `${base}/blog/${post.slug}`, lastModified: post.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 }))];
  } catch {
    return staticRoutes;
  }
}
