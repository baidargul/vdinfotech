"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  calculateReadingMinutes,
  createUniqueSlug,
  extractMediaIds,
  htmlToPlainText,
  normalizeTags,
  sanitizePostHtml,
} from "@/lib/blog";
import { connectToDatabase } from "@/lib/db";
import { removeImage } from "@/lib/media-storage";
import { Media } from "@/models/media";
import { Post } from "@/models/post";

const postSchema = z.object({
  title: z.string().trim().min(5, "Title must contain at least 5 characters.").max(160),
  excerpt: z.string().trim().min(20, "Excerpt must contain at least 20 characters.").max(320),
  category: z.string().trim().min(2, "Enter a category.").max(60),
  tags: z.string().max(400),
  contentHtml: z.string().min(1, "Write some post content."),
  seoTitle: z.string().trim().max(70, "SEO title must contain at most 70 characters."),
  seoDescription: z.string().trim().max(170, "SEO description must contain at most 170 characters."),
  coverMediaId: z.string().trim(),
  postId: z.string().trim(),
  intent: z.enum(["draft", "publish", "schedule"]),
  publishedAt: z.string().trim(),
  timezoneOffset: z.coerce.number().min(-840).max(840),
});

export type PostFormState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

function parseScheduledDate(value: string, offsetMinutes: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Date.UTC(+year, +month - 1, +day, +hour, +minute) + offsetMinutes * 60_000,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function refreshBlog(slug?: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/posts");
  revalidatePath("/dashboard/posts/trash");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function savePostAction(
  _state: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const user = await requireUser();
  const raw = Object.fromEntries([
    "title", "excerpt", "category", "tags", "contentHtml", "seoTitle",
    "seoDescription", "coverMediaId", "postId", "intent", "publishedAt",
    "timezoneOffset",
  ].map((key) => [key, String(formData.get(key) ?? "")]));
  const parsed = postSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, message: "Please correct the highlighted fields." };
  }

  const contentHtml = sanitizePostHtml(parsed.data.contentHtml);
  const contentText = htmlToPlainText(contentHtml);
  if (contentText.length < 50) {
    return { errors: { contentHtml: ["Post content must contain at least 50 characters."] } };
  }

  let status: "draft" | "published" = "draft";
  let publishedAt: Date | null = null;
  if (parsed.data.intent === "publish") {
    status = "published";
    publishedAt = new Date();
  } else if (parsed.data.intent === "schedule") {
    publishedAt = parseScheduledDate(parsed.data.publishedAt, parsed.data.timezoneOffset);
    if (!publishedAt || publishedAt <= new Date()) {
      return { errors: { publishedAt: ["Choose a valid future publishing date and time."] } };
    }
    status = "published";
  }

  const inlineMediaIds = extractMediaIds(contentHtml);
  const requestedMediaIds = [...new Set([
    ...inlineMediaIds,
    ...(parsed.data.coverMediaId ? [parsed.data.coverMediaId] : []),
  ])];
  if (requestedMediaIds.some((id) => !Types.ObjectId.isValid(id))) {
    return { message: "One or more selected images are invalid." };
  }

  await connectToDatabase();
  const ownedMedia = requestedMediaIds.length
    ? await Media.find({ _id: { $in: requestedMediaIds }, owner: user.id }).select("_id post").lean().exec()
    : [];
  if (
    ownedMedia.length !== requestedMediaIds.length ||
    ownedMedia.some((media) => media.post && media.post.toString() !== parsed.data.postId)
  ) {
    return { message: "One or more selected images are unavailable." };
  }

  const isEditing = Boolean(parsed.data.postId);
  let post = null;
  if (isEditing) {
    if (!Types.ObjectId.isValid(parsed.data.postId)) return { message: "Post not found." };
    post = await Post.findOne({ _id: parsed.data.postId, author: user.id, deletedAt: null }).exec();
    if (!post) return { message: "Post not found or you do not have access." };
  }

  const previousMediaIds = post?.mediaIds.map((id: Types.ObjectId) => id.toString()) ?? [];
  const slug = post?.slug ?? await createUniqueSlug(parsed.data.title);
  const values = {
    title: parsed.data.title,
    excerpt: parsed.data.excerpt,
    category: parsed.data.category,
    tags: normalizeTags(parsed.data.tags),
    contentHtml,
    contentText,
    seoTitle: parsed.data.seoTitle,
    seoDescription: parsed.data.seoDescription,
    coverMedia: parsed.data.coverMediaId || null,
    mediaIds: requestedMediaIds,
    readingMinutes: calculateReadingMinutes(contentText),
    status,
    publishedAt,
  };

  if (post) {
    post.set(values);
    await post.save();
  } else {
    post = await Post.create({ ...values, author: user.id, slug });
  }

  const removedIds = previousMediaIds.filter((id: string) => !requestedMediaIds.includes(id));
  if (removedIds.length) {
    const removedMedia = await Media.find({ _id: { $in: removedIds }, owner: user.id, post: post._id }).select("storedName").lean().exec();
    await Promise.all(removedMedia.map((item) => removeImage(item.storedName)));
    await Media.deleteMany({ _id: { $in: removedIds }, owner: user.id, post: post._id });
  }
  if (requestedMediaIds.length) {
    await Media.updateMany({ _id: { $in: requestedMediaIds }, owner: user.id }, { $set: { post: post._id } });
  }

  refreshBlog(slug);
  if (!isEditing) redirect(`/dashboard/posts/${post._id.toString()}/edit`);
  return { success: true, message: parsed.data.intent === "draft" ? "Draft saved." : parsed.data.intent === "schedule" ? "Post scheduled." : "Post published." };
}

export async function movePostToTrashAction(formData: FormData) {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  if (!Types.ObjectId.isValid(postId)) return;
  await connectToDatabase();
  const post = await Post.findOneAndUpdate(
    { _id: postId, author: user.id, deletedAt: null },
    { $set: { deletedAt: new Date() } },
  ).exec();
  if (post) refreshBlog(post.slug);
}

export async function restorePostAction(formData: FormData) {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  if (!Types.ObjectId.isValid(postId)) return;
  await connectToDatabase();
  const post = await Post.findOneAndUpdate(
    { _id: postId, author: user.id, deletedAt: { $ne: null } },
    { $set: { deletedAt: null } },
  ).exec();
  if (post) refreshBlog(post.slug);
}

export async function permanentlyDeletePostAction(formData: FormData) {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  if (!Types.ObjectId.isValid(postId)) return;
  await connectToDatabase();
  const post = await Post.findOne({ _id: postId, author: user.id, deletedAt: { $ne: null } }).exec();
  if (!post) return;

  const media = await Media.find({ owner: user.id, post: post._id }).select("storedName").lean().exec();
  await Promise.all(media.map((item) => removeImage(item.storedName)));
  await Media.deleteMany({ owner: user.id, post: post._id });
  await post.deleteOne();
  refreshBlog(post.slug);
}

export async function unpublishPostAction(formData: FormData) {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  if (!Types.ObjectId.isValid(postId)) return;
  await connectToDatabase();
  const post = await Post.findOneAndUpdate(
    { _id: postId, author: user.id, deletedAt: null },
    { $set: { status: "draft", publishedAt: null } },
  ).exec();
  if (post) refreshBlog(post.slug);
}
