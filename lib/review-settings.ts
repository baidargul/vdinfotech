import "server-only";

import { connectToDatabase } from "@/lib/db";
import { SiteSettings } from "@/models/site-settings";

export const reviewTransitions = ["fade", "slide", "zoom"] as const;
export type ReviewTransition = (typeof reviewTransitions)[number];

export type ReviewItemData = {
  id: string;
  name: string;
  role: string;
  quote: string;
  detail: string;
  rating: number;
  imageId: string;
  imageUrl: string;
  imageAlt: string;
};

export type ReviewSettingsData = {
  autoplay: boolean;
  interval: number;
  transition: ReviewTransition;
  reviews: ReviewItemData[];
};

export const defaultReviewSettings: ReviewSettingsData = {
  autoplay: true,
  interval: 6000,
  transition: "fade",
  reviews: [{
    id: "maria-ahmed",
    name: "Maria Ahmed",
    role: "Product Director, Northstar",
    quote: "VD Infotech challenged the brief, simplified the experience, and delivered a platform our customers genuinely love.",
    detail: "They worked like an extension of our own team—clear, thoughtful, and focused on outcomes from the very first workshop.",
    rating: 5,
    imageId: "",
    imageUrl: "",
    imageAlt: "Portrait of Maria Ahmed",
  }],
};

type StoredReview = {
  reviewId?: string;
  name?: string;
  role?: string;
  quote?: string;
  detail?: string;
  rating?: number;
  image?: { toString(): string } | null;
  imageAlt?: string;
};

export async function getReviewSettings(): Promise<ReviewSettingsData> {
  await connectToDatabase();
  const settings = await SiteSettings.findOne({ key: "website" })
    .select("reviews")
    .lean()
    .exec() as { reviews?: { autoplay?: boolean; interval?: number; transition?: ReviewTransition; items?: StoredReview[] } } | null;

  const items = settings?.reviews?.items;
  if (!items?.length) return defaultReviewSettings;

  return {
    autoplay: settings?.reviews?.autoplay ?? defaultReviewSettings.autoplay,
    interval: settings?.reviews?.interval ?? defaultReviewSettings.interval,
    transition: reviewTransitions.includes(settings?.reviews?.transition as ReviewTransition)
      ? settings?.reviews?.transition as ReviewTransition
      : defaultReviewSettings.transition,
    reviews: items.map((review, index) => {
      const imageId = review.image?.toString() ?? "";
      return {
        id: review.reviewId || `review-${index + 1}`,
        name: review.name || "Client",
        role: review.role || "Verified client",
        quote: review.quote || "A thoughtful and dependable delivery partner.",
        detail: review.detail || "",
        rating: Math.min(5, Math.max(1, review.rating ?? 5)),
        imageId,
        imageUrl: imageId ? `/media/${imageId}` : "",
        imageAlt: review.imageAlt || `Portrait of ${review.name || "client"}`,
      };
    }),
  };
}
