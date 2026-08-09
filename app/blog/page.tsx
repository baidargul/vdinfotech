import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { connectToDatabase } from "@/lib/db";
import { POSTS_PER_PAGE, publicPostFilter } from "@/lib/blog";
import { findPublishedPosts } from "@/lib/blog-data";
import { Post } from "@/models/post";

export const metadata: Metadata = {
  title: "Insights | VD Infotech",
  description: "Ideas and practical guidance on software, product design, engineering, and digital growth from VD Infotech.",
  alternates: { canonical: "/blog" },
};
export const dynamic = "force-dynamic";

function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export default async function BlogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const category = typeof params.category === "string" ? params.category.trim().slice(0, 60) : "";
  const tag = typeof params.tag === "string" ? params.tag.trim().slice(0, 40) : "";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);
  const filter: Record<string, unknown> = {};
  if (q) filter.$or = ["title", "excerpt", "contentText", "category", "tags"].map((field) => ({ [field]: { $regex: escapeRegex(q), $options: "i" } }));
  if (category) filter.category = category;
  if (tag) filter.tags = tag;

  await connectToDatabase();
  const [posts, total, categories, tags] = await Promise.all([
    findPublishedPosts(filter, { skip: (page - 1) * POSTS_PER_PAGE, limit: POSTS_PER_PAGE }),
    Post.countDocuments({ ...publicPostFilter(), ...filter }),
    Post.distinct("category", publicPostFilter()),
    Post.distinct("tags", publicPostFilter()),
  ]);
  const pages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const href = (updates: Record<string, string>) => `/blog?${new URLSearchParams({ ...(q ? { q } : {}), ...(category ? { category } : {}), ...(tag ? { tag } : {}), ...updates })}`;

  return <main className="blog-page"><section className="blog-hero"><div className="shell"><p className="eyebrow light"><span /> VD Infotech insights</p><h1>Ideas for building digital products that <em>matter.</em></h1><p>Practical perspectives from the people designing and engineering modern software.</p></div></section><section className="blog-listing shell"><form className="blog-search"><input type="search" name="q" defaultValue={q} placeholder="Search articles" aria-label="Search articles" /><button type="submit">Search</button></form><div className="blog-filter-row"><Link className={!category && !tag ? "is-active" : ""} href={q ? `/blog?q=${encodeURIComponent(q)}` : "/blog"}>All</Link>{categories.slice(0, 8).map((item) => <Link className={category === item ? "is-active" : ""} href={href({ category: item, tag: "", page: "1" })} key={item}>{item}</Link>)}</div>{tag && <p className="active-filter">Showing tag: <strong>#{tag}</strong> <Link href={href({ tag: "", page: "1" })}>Clear</Link></p>}{posts.length ? <div className="blog-card-grid">{posts.map((post, index) => <article className={index === 0 && page === 1 && !q && !category && !tag ? "blog-card is-featured" : "blog-card"} key={post.id}>{post.cover ? <Link className="blog-card-image" href={`/blog/${post.slug}`}><Image src={`/media/${post.cover.id}`} alt={post.cover.altText || post.title} width={900} height={560} unoptimized /></Link> : <Link className="blog-card-image blog-card-placeholder" href={`/blog/${post.slug}`}><span>VD</span></Link>}<div className="blog-card-copy"><span className="blog-category">{post.category}</span><h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt}</p><div><span>{post.author.name}</span><span>{post.readingMinutes} min read</span><time>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(post.publishedAt)}</time></div><div className="blog-tags">{post.tags.slice(0, 3).map((item) => <Link href={`/blog?tag=${encodeURIComponent(item)}`} key={item}>#{item}</Link>)}</div></div></article>)}</div> : <div className="blog-empty"><h2>No articles found.</h2><p>Try another keyword or clear the selected filter.</p><Link href="/blog">View all articles</Link></div>}{pages > 1 && <nav className="pagination blog-pagination" aria-label="Blog pagination">{page > 1 && <Link href={href({ page: String(page - 1) })}>← Previous</Link>}<span>Page {Math.min(page, pages)} of {pages}</span>{page < pages && <Link href={href({ page: String(page + 1) })}>Next →</Link>}</nav>}<aside className="popular-tags"><span>Explore topics</span>{tags.slice(0, 12).map((item) => <Link href={`/blog?tag=${encodeURIComponent(item)}`} key={item}>#{item}</Link>)}</aside></section></main>;
}
