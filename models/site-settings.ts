import "server-only";

import { Schema, deleteModel, model, models } from "mongoose";

const whatsappSchema = new Schema({
  enabled: { type: Boolean, default: false },
  phoneNumber: {
    type: String,
    trim: true,
    validate: {
      validator: (value: string) => !value || /^[6-9]\d{9}$/.test(value),
      message: "Enter a valid 10-digit Indian mobile number.",
    },
    default: "",
  },
  customMessage: { type: String, trim: true, maxlength: 500, default: "" },
}, { _id: false });

const contactWidgetSchema = new Schema({
  enabled: { type: Boolean, default: true },
  kicker: { type: String, trim: true, maxlength: 80, default: "Let's build something useful" },
  heading: { type: String, trim: true, maxlength: 80, default: "Hi there" },
  description: { type: String, trim: true, maxlength: 240, default: "Share a few details and our team will get back to you shortly." },
  buttonLabel: { type: String, trim: true, maxlength: 60, default: "Start a conversation" },
}, { _id: false });

const reviewItemSchema = new Schema({
  reviewId: { type: String, required: true, trim: true, maxlength: 80 },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  role: { type: String, required: true, trim: true, maxlength: 120 },
  quote: { type: String, required: true, trim: true, maxlength: 1000 },
  detail: { type: String, trim: true, maxlength: 600, default: "" },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  image: { type: Schema.Types.ObjectId, ref: "Media", default: null },
  imageAlt: { type: String, trim: true, maxlength: 180, default: "" },
}, { _id: false });

const reviewsSchema = new Schema({
  autoplay: { type: Boolean, default: true },
  interval: { type: Number, min: 2000, max: 30000, default: 6000 },
  transition: { type: String, enum: ["fade", "slide", "zoom"], default: "fade" },
  items: { type: [reviewItemSchema], default: () => [] },
}, { _id: false });

const siteSettingsSchema = new Schema({
  key: { type: String, unique: true, default: "website", immutable: true },
  whatsapp: { type: whatsappSchema, default: () => ({}) },
  contactWidget: { type: contactWidgetSchema, default: () => ({}) },
  reviews: { type: reviewsSchema, default: () => ({}) },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

if (models.SiteSettings && (!models.SiteSettings.schema.path("reviews") || !models.SiteSettings.schema.path("contactWidget"))) {
  deleteModel("SiteSettings");
}

export const SiteSettings = models.SiteSettings || model("SiteSettings", siteSettingsSchema);
