import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { findPublishedPosts, getPublicPostBySlug, siteUrl } from "@/lib/blog-data";
import { ShareButtons } from "../share-buttons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicPostBySlug(slug);
  if (!post) return { title: "Article Not Found | VD Infotech" };
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const url = `${siteUrl()}/blog/${post.slug}`;
  const images = post.cover ? [{ url: `${siteUrl()}/media/${post.cover.id}`, alt: post.cover.altText || post.title }] : [];
  return { title: `${title} | VD Infotech`, description, alternates: { canonical: url }, openGraph: { type: "article", title, description, url, publishedTime: post.publishedAt.toISOString(), authors: [post.author.name], tags: post.tags, images }, twitter: { card: "summary_large_image", title, description, images: images.map((image) => image.url) } };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPublicPostBySlug(slug);
  if (!post) notFound();
  const related = await findPublishedPosts({ _id: { $ne: post.id }, $or: [{ category: post.category }, { tags: { $in: post.tags } }] }, { limit: 3 });
  const articleUrl = `${siteUrl()}/blog/${post.slug}`;
  const jsonLd = { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.seoDescription || post.excerpt, datePublished: post.publishedAt.toISOString(), author: { "@type": "Person", name: post.author.name }, publisher: { "@type": "Organization", name: "VD Infotech", url: siteUrl() }, mainEntityOfPage: articleUrl, ...(post.cover ? { image: `${siteUrl()}/media/${post.cover.id}` } : {}) };
  return <main className="article-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><article className="blog-article public-article"><header><Link className="blog-category" href={`/blog?category=${encodeURIComponent(post.category)}`}>{post.category}</Link><h1>{post.title}</h1><p>{post.excerpt}</p><div className="article-meta"><span>By {post.author.name}</span><time>{new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(post.publishedAt)}</time><span>{post.readingMinutes} min read</span><ShareButtons title={post.title} /></div></header>{post.cover && <Image className="article-cover" src={`/media/${post.cover.id}`} alt={post.cover.altText || post.title} width={1100} height={620} unoptimized priority />}<div className="article-content" dangerouslySetInnerHTML={{ __html: post.contentHtml }} /><footer className="article-tags">{post.tags.map((tag) => <Link href={`/blog?tag=${encodeURIComponent(tag)}`} key={tag}>#{tag}</Link>)}</footer></article>{related.length > 0 && <section className="related-posts shell"><div className="section-heading"><p className="eyebrow"><span /> Continue reading</p><h2>More useful <em>ideas.</em></h2></div><div>{related.map((item) => <article key={item.id}><span>{item.category}</span><h3><Link href={`/blog/${item.slug}`}>{item.title}</Link></h3><p>{item.excerpt}</p><Link href={`/blog/${item.slug}`}>Read article →</Link></article>)}</div></section>}</main>;
}
