import { getLatestPosts, siteUrl } from "@/lib/blog-data";

function xml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character]!);
}

export async function GET() {
  const base = siteUrl();
  let posts: Awaited<ReturnType<typeof getLatestPosts>> = [];
  try { posts = await getLatestPosts(30); } catch { /* Return a valid empty feed if the database is unavailable. */ }
  const items = posts.map((post) => `<item><title>${xml(post.title)}</title><link>${base}/blog/${post.slug}</link><guid>${base}/blog/${post.slug}</guid><description>${xml(post.excerpt)}</description><pubDate>${post.publishedAt.toUTCString()}</pubDate><author>${xml(post.author.name)}</author>${post.tags.map((tag) => `<category>${xml(tag)}</category>`).join("")}</item>`).join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>VD Infotech Insights</title><link>${base}/blog</link><description>Ideas on product, design, engineering, and digital growth.</description><language>en</language>${items}</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } });
}
