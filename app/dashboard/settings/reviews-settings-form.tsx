"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { saveReviewSettingsAction, type ReviewSettingsState } from "@/app/actions/settings";
import { createClientId } from "@/lib/client-id";
import type { ReviewItemData, ReviewSettingsData } from "@/lib/review-settings";

const emptyReview = (): ReviewItemData => ({
  id: createClientId(),
  name: "",
  role: "",
  quote: "",
  detail: "",
  rating: 5,
  imageId: "",
  imageUrl: "",
  imageAlt: "",
});

export function ReviewsSettingsForm({ initialSettings }: { initialSettings: ReviewSettingsData }) {
  const initialState: ReviewSettingsState = {};
  const [state, formAction, pending] = useActionState(saveReviewSettingsAction, initialState);
  const [settings, setSettings] = useState(initialSettings);
  const [activeReviewId, setActiveReviewId] = useState(initialSettings.reviews[0]?.id ?? "");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateReview = (id: string, patch: Partial<ReviewItemData>) => {
    setSettings((current) => ({
      ...current,
      reviews: current.reviews.map((review) => review.id === id ? { ...review, ...patch } : review),
    }));
  };

  const uploadImage = async (review: ReviewItemData, file?: File) => {
    if (!file) return;
    setUploadingId(review.id);
    setUploadError("");
    const body = new FormData();
    body.set("image", file);
    body.set("altText", review.imageAlt || `Portrait of ${review.name || "client"}`);

    try {
      const response = await fetch("/api/media", { method: "POST", body });
      const result = await response.json() as { id?: string; url?: string; altText?: string; error?: string };
      if (!response.ok || !result.id || !result.url) throw new Error(result.error || "Image upload failed.");
      updateReview(review.id, {
        imageId: result.id,
        imageUrl: result.url,
        imageAlt: result.altText || review.imageAlt || `Portrait of ${review.name || "client"}`,
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploadingId(null);
      if (fileInputs.current[review.id]) fileInputs.current[review.id]!.value = "";
    }
  };

  const addReview = () => {
    const review = emptyReview();
    setSettings((current) => ({ ...current, reviews: [...current.reviews, review] }));
    setActiveReviewId(review.id);
  };

  const removeReview = (id: string) => {
    if (settings.reviews.length === 1) return;
    const currentIndex = settings.reviews.findIndex((review) => review.id === id);
    const nextReviews = settings.reviews.filter((review) => review.id !== id);
    setSettings((current) => ({ ...current, reviews: nextReviews }));
    setActiveReviewId(nextReviews[Math.min(currentIndex, nextReviews.length - 1)].id);
  };

  const activeReview = settings.reviews.find((review) => review.id === activeReviewId) ?? settings.reviews[0];
  const activeIndex = settings.reviews.findIndex((review) => review.id === activeReview.id);

  return (
    <form className="settings-form reviews-settings-form" action={formAction}>
      <input type="hidden" name="settings" value={JSON.stringify(settings)} />
      {state.message && <p className={state.success ? "editor-notice is-success" : "editor-notice"} role="status" aria-live="polite">{state.message}</p>}
      {state.errors?.length ? <div className="editor-notice" role="alert">{state.errors.map((error) => <p key={error}>{error}</p>)}</div> : null}
      {uploadError && <p className="editor-notice" role="alert">{uploadError}</p>}

      <div className="review-playback-settings">
        <label className="settings-toggle">
          <span><strong>Auto play reviews</strong><small>Move to the next review automatically on the website.</small></span>
          <input type="checkbox" checked={settings.autoplay} onChange={(event) => setSettings((current) => ({ ...current, autoplay: event.target.checked }))} />
          <i aria-hidden="true" />
        </label>
        <label className="editor-field">
          <span>Slide duration</span>
          <select value={settings.interval} onChange={(event) => setSettings((current) => ({ ...current, interval: Number(event.target.value) }))} disabled={!settings.autoplay}>
            {[3, 4, 5, 6, 8, 10, 15, 20, 30].map((seconds) => <option key={seconds} value={seconds * 1000}>{seconds} seconds</option>)}
          </select>
          <small>Time each review remains visible.</small>
        </label>
        <label className="editor-field">
          <span>Transition effect</span>
          <select value={settings.transition} onChange={(event) => setSettings((current) => ({ ...current, transition: event.target.value as ReviewSettingsData["transition"] }))}>
            <option value="fade">Soft fade</option>
            <option value="slide">Horizontal slide</option>
            <option value="zoom">Gentle zoom</option>
          </select>
          <small>Animation used between reviews.</small>
        </label>
      </div>

      <div className="reviews-list-heading">
        <div><h3>Client reviews</h3><p>Add as many reviews as you need. Each one can have its own client photo.</p></div>
        <button className="editor-submit" type="button" onClick={addReview}>+ Add review</button>
      </div>

      <div className="review-quick-select" role="tablist" aria-label="Select a review to edit">
        {settings.reviews.map((review, index) => {
          const initials = review.name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || String(index + 1).padStart(2, "0");
          return (
            <button className={review.id === activeReview.id ? "is-active" : ""} type="button" role="tab" aria-selected={review.id === activeReview.id} aria-controls="review-editor-panel" key={review.id} onClick={() => setActiveReviewId(review.id)}>
              <span className="review-quick-avatar">{review.imageUrl ? <Image src={review.imageUrl} alt="" fill sizes="42px" /> : initials}</span>
              <span><small>Review {index + 1}</small><strong>{review.name || "Untitled review"}</strong><em>{review.role || "Add role or company"}</em></span>
            </button>
          );
        })}
      </div>

      <div className="reviews-editor-list">
          <article className="review-editor-card" id="review-editor-panel" role="tabpanel" key={activeReview.id}>
            <div className="review-editor-heading">
              <strong>Review {activeIndex + 1}</strong>
              <button type="button" onClick={() => removeReview(activeReview.id)} disabled={settings.reviews.length === 1}>Remove</button>
            </div>
            <div className="review-editor-grid">
              <div className="review-photo-editor">
                <div className="review-photo-preview">
                  {activeReview.imageUrl ? <Image src={activeReview.imageUrl} alt={activeReview.imageAlt || "Review client"} fill sizes="160px" /> : <span>{activeReview.name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "Photo"}</span>}
                </div>
                <input ref={(node) => { fileInputs.current[activeReview.id] = node; }} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => void uploadImage(activeReview, event.target.files?.[0])} />
                <button className="editor-submit" type="button" disabled={uploadingId === activeReview.id} onClick={() => fileInputs.current[activeReview.id]?.click()}>{uploadingId === activeReview.id ? "Uploading…" : activeReview.imageUrl ? "Replace photo" : "Upload photo"}</button>
                {activeReview.imageUrl && <button className="review-photo-remove" type="button" onClick={() => updateReview(activeReview.id, { imageId: "", imageUrl: "" })}>Remove photo</button>}
              </div>
              <div className="review-fields">
                <div className="review-fields-row">
                  <label className="editor-field"><span>Client name</span><input value={activeReview.name} maxLength={80} required onChange={(event) => updateReview(activeReview.id, { name: event.target.value })} /></label>
                  <label className="editor-field"><span>Role / company</span><input value={activeReview.role} maxLength={120} required onChange={(event) => updateReview(activeReview.id, { role: event.target.value })} /></label>
                </div>
                <label className="editor-field"><span>Main review</span><textarea rows={4} value={activeReview.quote} maxLength={1000} required onChange={(event) => updateReview(activeReview.id, { quote: event.target.value })} /></label>
                <label className="editor-field"><span>Supporting text</span><textarea rows={3} value={activeReview.detail} maxLength={600} onChange={(event) => updateReview(activeReview.id, { detail: event.target.value })} /></label>
                <div className="review-fields-row">
                  <label className="editor-field"><span>Rating</span><select value={activeReview.rating} onChange={(event) => updateReview(activeReview.id, { rating: Number(event.target.value) })}>{[5, 4, 3, 2, 1].map((rating) => <option value={rating} key={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}</select></label>
                  <label className="editor-field"><span>Photo alt text</span><input value={activeReview.imageAlt} maxLength={180} placeholder={`Portrait of ${activeReview.name || "client"}`} onChange={(event) => updateReview(activeReview.id, { imageAlt: event.target.value })} /></label>
                </div>
              </div>
            </div>
          </article>
      </div>

      <div className="settings-form-actions">
        <span>{settings.reviews.length} review{settings.reviews.length === 1 ? "" : "s"} will appear on the website.</span>
        <button className="editor-submit editor-publish" type="submit" disabled={pending || uploadingId !== null}>{pending ? "Saving…" : "Save reviews"}</button>
      </div>
    </form>
  );
}
