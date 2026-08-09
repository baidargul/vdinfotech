import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { postDisplayStatus } from "@/lib/blog";
import { Post } from "@/models/post";
import { PostRowActions } from "./post-row-actions";

export const metadata: Metadata = { title: "Manage Posts | VD Infotech" };
const PAGE_SIZE = 10;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function PostsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);
  const now = new Date();
  const filter: Record<string, unknown> = { author: user.id, deletedAt: null };
  if (query) filter.$or = ["title", "excerpt", "category", "tags"].map((field) => ({ [field]: { $regex: escapeRegex(query), $options: "i" } }));
  if (status === "draft") filter.status = "draft";
  if (status === "published") Object.assign(filter, { status: "published", publishedAt: { $lte: now } });
  if (status === "scheduled") Object.assign(filter, { status: "published", publishedAt: { $gt: now } });

  await connectToDatabase();
  const [posts, total] = await Promise.all([
    Post.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean().exec(),
    Post.countDocuments(filter),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (nextPage: number) => `/dashboard/posts?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(status !== "all" ? { status } : {}), page: String(nextPage) })}`;

  return <section className="dashboard-content dashboard-post-manager">
    <div className="manager-heading"><div><p className="eyebrow"><span /> Content library</p><h1>Your posts</h1><p>Search, preview, publish, and maintain every story.</p></div><Link className="dashboard-primary-action" href="/dashboard/posts/new">Create new post</Link></div>
    <form className="post-filters"><input type="search" name="q" defaultValue={query} placeholder="Search your posts" /><select name="status" defaultValue={status}><option value="all">All statuses</option><option value="draft">Drafts</option><option value="published">Published</option><option value="scheduled">Scheduled</option></select><button type="submit">Filter</button></form>
    <section className="dashboard-card post-table-card">
      {posts.length ? <div className="post-table"><div className="post-table-head"><span>Post</span><span>Status</span><span>Updated</span><span>Actions</span></div>{posts.map((post) => { const displayStatus = postDisplayStatus(post); return <article key={post._id.toString()}><div><strong>{post.title}</strong><p>{post.category} · {post.readingMinutes} min read</p></div><span className={`post-status status-${displayStatus.toLowerCase()}`}>{displayStatus}</span><time>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(post.updatedAt)}</time><PostRowActions postId={post._id.toString()} published={post.status === "published"} /></article>; })}</div> : <div className="dashboard-empty"><h3>No posts found.</h3><p>Adjust the filters or begin a new story.</p><Link href="/dashboard/posts/new">Create a post</Link></div>}
    </section>
    {pages > 1 && <nav className="pagination" aria-label="Posts pagination">{page > 1 && <Link href={pageHref(page - 1)}>← Previous</Link>}<span>Page {Math.min(page, pages)} of {pages}</span>{page < pages && <Link href={pageHref(page + 1)}>Next →</Link>}</nav>}
  </section>;
}
