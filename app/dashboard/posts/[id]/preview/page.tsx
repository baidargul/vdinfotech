import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Media } from "@/models/media";
import { Post } from "@/models/post";

export const metadata: Metadata = { title: "Post Preview | VD Infotech", robots: { index: false, follow: false } };

export default async function PreviewPostPage({ params }: PageProps<"/dashboard/posts/[id]/preview">) {
  const user = await requireUser();
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  await connectToDatabase();
  const post = await Post.findOne({ _id: id, author: user.id, deletedAt: null }).lean().exec();
  if (!post) notFound();
  const cover = post.coverMedia ? await Media.findById(post.coverMedia).select("_id altText").lean().exec() : null;
  return <section className="dashboard-content preview-page"><div className="preview-banner"><span>Private preview</span><Link href={`/dashboard/posts/${id}/edit`}>← Back to editor</Link></div><article className="blog-article"><header><span className="blog-category">{post.category}</span><h1>{post.title}</h1><p>{post.excerpt}</p><div className="article-meta"><span>{user.name}</span><span>{post.readingMinutes} min read</span></div></header>{cover && <Image className="article-cover" src={`/media/${cover._id.toString()}`} alt={cover.altText || post.title} width={1100} height={620} unoptimized />}<div className="article-content" dangerouslySetInnerHTML={{ __html: post.contentHtml }} /></article></section>;
}
