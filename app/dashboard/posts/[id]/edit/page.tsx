import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Media } from "@/models/media";
import { Post } from "@/models/post";
import { PostEditor, type EditablePost } from "../../post-editor";

export const metadata: Metadata = { title: "Edit Post | VD Infotech" };

export default async function EditPostPage({ params }: PageProps<"/dashboard/posts/[id]/edit">) {
  const user = await requireUser();
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  await connectToDatabase();
  const post = await Post.findOne({ _id: id, author: user.id, deletedAt: null }).lean().exec();
  if (!post) notFound();
  const cover = post.coverMedia ? await Media.findOne({ _id: post.coverMedia, owner: user.id }).lean().exec() : null;
  const editable: EditablePost = {
    id: post._id.toString(), title: post.title, excerpt: post.excerpt, category: post.category,
    tags: post.tags, contentHtml: post.contentHtml, seoTitle: post.seoTitle || "",
    seoDescription: post.seoDescription || "", publishedAt: post.publishedAt?.toISOString() || "",
    status: post.status, cover: cover ? { id: cover._id.toString(), url: `/media/${cover._id.toString()}`, altText: cover.altText } : null,
  };
  return <section className="dashboard-content dashboard-editor-page"><PostEditor post={editable} /></section>;
}
