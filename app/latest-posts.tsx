import Link from "next/link";
import Image from "next/image";
import { getLatestPosts } from "@/lib/blog-data";

export async function LatestPosts() {
  let posts: Awaited<ReturnType<typeof getLatestPosts>> = [];
  try {
    posts = await getLatestPosts(3);
  } catch {
    return null;
  }
  if (!posts.length) return null;

  return <section className="section homepage-blog"><div className="shell"><div className="homepage-blog-heading"><div><p className="eyebrow"><span /> Latest thinking</p><h2>Ideas worth putting into <em>practice.</em></h2></div><Link className="text-link" href="/blog">Explore all articles →</Link></div><div className="homepage-post-grid">{posts.map((post) => <article key={post.id}>{post.cover ? <Link className="homepage-post-image" href={`/blog/${post.slug}`}><Image src={`/media/${post.cover.id}`} alt={post.cover.altText || post.title} width={700} height={440} unoptimized /></Link> : <Link className="homepage-post-image homepage-post-placeholder" href={`/blog/${post.slug}`}><span>VD</span></Link>}<span>{post.category}</span><h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3><p>{post.excerpt}</p><div><span>{post.readingMinutes} min read</span><Link href={`/blog/${post.slug}`}>Read →</Link></div></article>)}</div></div></section>;
}
