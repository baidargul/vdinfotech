import "server-only";

import { Schema, model, models } from "mongoose";

const postSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 320 },
    contentHtml: { type: String, required: true },
    contentText: { type: String, required: true },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    tags: [{ type: String, trim: true, maxlength: 40 }],
    coverMedia: { type: Schema.Types.ObjectId, ref: "Media", default: null },
    mediaIds: [{ type: Schema.Types.ObjectId, ref: "Media" }],
    seoTitle: { type: String, trim: true, maxlength: 70, default: "" },
    seoDescription: { type: String, trim: true, maxlength: 170, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    publishedAt: { type: Date, default: null },
    readingMinutes: { type: Number, min: 1, default: 1 },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

postSchema.index(
  { title: "text", excerpt: "text", contentText: "text", category: "text", tags: "text" },
  { weights: { title: 10, excerpt: 6, category: 5, tags: 4, contentText: 1 } },
);
postSchema.index({ author: 1, deletedAt: 1, updatedAt: -1 });
postSchema.index({ status: 1, deletedAt: 1, publishedAt: -1 });

export const Post = models.Post || model("Post", postSchema);
