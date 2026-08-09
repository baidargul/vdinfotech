import "server-only";

import { Schema, model, models } from "mongoose";

const mediaSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", default: null, index: true },
    kind: { type: String, enum: ["image", "download"], default: "image", index: true },
    storedName: { type: String, required: true, unique: true },
    originalName: { type: String, required: true, maxlength: 255 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    altText: { type: String, trim: true, maxlength: 180, default: "" },
  },
  { timestamps: true },
);

export const Media = models.Media || model("Media", mediaSchema);
