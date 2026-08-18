import "server-only";

import { Schema, model, models } from "mongoose";

const leadSchema = new Schema({
  visitorId: { type: String, trim: true, maxlength: 80, index: true, default: "" },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160, index: true },
  phone: { type: String, trim: true, maxlength: 24, default: "" },
  company: { type: String, trim: true, maxlength: 120, default: "" },
  service: { type: String, trim: true, maxlength: 80, default: "" },
  message: { type: String, trim: true, maxlength: 1500, default: "" },
  source: { type: String, enum: ["chat-widget", "contact-form"], required: true, index: true },
  pageUrl: { type: String, trim: true, maxlength: 500, default: "" },
  status: { type: String, enum: ["new", "contacted", "qualified", "closed"], default: "new", index: true },
}, { timestamps: true });

leadSchema.index({ createdAt: -1 });
leadSchema.index({ name: "text", email: "text", phone: "text", company: "text", message: "text" });

export const Lead = models.Lead || model("Lead", leadSchema);
