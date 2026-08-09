import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { publicPostFilter } from "@/lib/blog";
import { Post } from "@/models/post";

const staticTargets = [
  { title: "Home", url: "/", type: "Page" },
  { title: "About", url: "/#about", type: "Page section" },
  { title: "Services", url: "/#services", type: "Page section" },
  { title: "Selected work", url: "/#work", type: "Page section" },
  { title: "Process", url: "/#process", type: "Page section" },
  { title: "Contact", url: "/#contact", type: "Page section" },
  { title: "Blog", url: "/blog", type: "Page" },
  { title: "Login", url: "/login", type: "Page" },
  { title: "Create account", url: "/signup", type: "Page" },
];

function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) || "";
  const matchingStatic = staticTargets.filter((target) => !query || `${target.title} ${target.url}`.toLowerCase().includes(query.toLowerCase()));
  await connectToDatabase();
  const posts = await Post.find({
    ...publicPostFilter(),
    ...(query ? { title: { $regex: escapeRegex(query), $options: "i" } } : {}),
  }).select("title slug").sort({ publishedAt: -1 }).limit(Math.max(0, 20 - matchingStatic.length)).lean().exec();
  return NextResponse.json({ targets: [
    ...matchingStatic,
    ...posts.map((post) => ({ title: post.title, url: `/blog/${post.slug}`, type: "Blog post" })),
  ].slice(0, 20) });
}
