import "server-only";

import { Schema, model, models } from "mongoose";

const heroTemplateSchema = new Schema(
  {
    schemaVersion: { type: Number, required: true, default: 1 },
    id: { type: String, required: true, unique: true, index: true },
    revision: { type: Number, required: true, min: 1 },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    createdBy: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: String, required: true },
    updatedBy: { type: Schema.Types.Mixed, required: true },
    updatedAt: { type: String, required: true, index: true },
    lastAppliedBy: { type: Schema.Types.Mixed, default: null },
    lastAppliedAt: { type: String, default: null },
    carousel: { type: Schema.Types.Mixed, required: true },
    activity: { type: [Schema.Types.Mixed], default: [] },
  },
  { versionKey: false },
);

export const HeroTemplate = models.HeroTemplate || model("HeroTemplate", heroTemplateSchema);
