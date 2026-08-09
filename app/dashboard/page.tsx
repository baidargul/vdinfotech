import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { postDisplayStatus } from "@/lib/blog";
import { Post } from "@/models/post";

export const metadata: Metadata = { title: "Dashboard | VD Infotech" };

export default async function DashboardPage() {
  const user = await requireUser();
  await connectToDatabase();
  const now = new Date();
  const [total, drafts, published, scheduled, recent] = await Promise.all([
    Post.countDocuments({ author: user.id, deletedAt: null }),
    Post.countDocuments({ author: user.id, deletedAt: null, status: "draft" }),
    Post.countDocuments({ author: user.id, deletedAt: null, status: "published", publishedAt: { $lte: now } }),
    Post.countDocuments({ author: user.id, deletedAt: null, status: "published", publishedAt: { $gt: now } }),
    Post.find({ author: user.id, deletedAt: null }).sort({ updatedAt: -1 }).limit(5).lean().exec(),
  ]);
  const firstName = user.name.split(/\s+/)[0];

  return (
    <section className="dashboard-content">
      <div className="dashboard-welcome">
        <div><p className="eyebrow"><span /> Creator overview</p><h1>Good to see you, <em>{firstName}.</em></h1><p>Write, publish, and grow your VD Infotech blog from one place.</p></div>
        <Link className="dashboard-primary-action" href="/dashboard/posts/new">Create new post</Link>
      </div>
      <div className="dashboard-stats dashboard-stats-four">
        {[
          ["Total posts", total, "All active content", "teal"],
          ["Published", published, "Visible to readers", "cyan"],
          ["Drafts", drafts, "Still in progress", "mint"],
          ["Scheduled", scheduled, "Publishing later", "paper"],
        ].map(([label, value, note, tone]) => <article className={`dashboard-stat stat-${tone}`} key={String(label)}><span>{label}</span><strong>{String(value).padStart(2, "0")}</strong><p>{note}</p></article>)}
      </div>
      <section className="dashboard-card dashboard-posts-card">
        <div className="dashboard-card-heading"><div><span>Latest work</span><h2>Recent posts</h2></div><Link href="/dashboard/posts">Manage all</Link></div>
        {recent.length ? <div className="dashboard-post-list">
          {recent.map((post) => <article key={post._id.toString()}><div><strong>{post.title}</strong><p>Updated {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(post.updatedAt)}</p></div><span className={`post-status status-${postDisplayStatus(post).toLowerCase()}`}>{postDisplayStatus(post)}</span><Link href={`/dashboard/posts/${post._id.toString()}/edit`}>Edit →</Link></article>)}
        </div> : <div className="dashboard-empty"><h3>Your first story starts here.</h3><p>Create a draft, add rich content and images, then publish when it is ready.</p><Link href="/dashboard/posts/new">Write your first post</Link></div>}
      </section>
    </section>
  );
}
