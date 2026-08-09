import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Post } from "@/models/post";
import { TrashRowActions } from "../post-row-actions";

export const metadata: Metadata = { title: "Trash | VD Infotech" };

export default async function TrashPage() {
  const user = await requireUser();
  await connectToDatabase();
  const posts = await Post.find({ author: user.id, deletedAt: { $ne: null } }).sort({ deletedAt: -1 }).lean().exec();
  return <section className="dashboard-content dashboard-post-manager"><div className="manager-heading"><div><p className="eyebrow"><span /> Recovery</p><h1>Trash</h1><p>Restore posts or permanently remove them with their uploaded images.</p></div></div><section className="dashboard-card post-table-card">{posts.length ? <div className="post-table trash-table"><div className="post-table-head"><span>Post</span><span>Deleted</span><span>Actions</span></div>{posts.map((post) => <article key={post._id.toString()}><div><strong>{post.title}</strong><p>{post.category}</p></div><time>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(post.deletedAt!)}</time><TrashRowActions postId={post._id.toString()} /></article>)}</div> : <div className="dashboard-empty"><h3>Trash is empty.</h3><p>Deleted posts will stay here until you restore or permanently remove them.</p></div>}</section></section>;
}
