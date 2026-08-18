"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ReviewSettingsData } from "@/lib/review-settings";

export function ReviewsCarousel({ settings }: { settings: ReviewSettingsData }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = settings.reviews.length;

  useEffect(() => {
    if (!settings.autoplay || paused || count < 2) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % count), settings.interval);
    return () => window.clearTimeout(timer);
  }, [count, index, paused, settings.autoplay, settings.interval]);

  if (!count) return null;
  const safeIndex = index % count;
  const review = settings.reviews[safeIndex];
  const initials = review.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const move = (direction: number) => setIndex((current) => (current + direction + count) % count);

  return (
    <section className="section testimonial-section" aria-label="Client reviews">
      <div className="shell testimonial-stage" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
        <div className={`testimonial-row review-transition-${settings.transition}`} key={review.id}>
          <div className={`testimonial-card${review.imageUrl ? " has-photo" : ""}`}>
            {review.imageUrl && <Image src={review.imageUrl} alt={review.imageAlt || `Portrait of ${review.name}`} fill sizes="(max-width: 760px) 360px, 310px" />}
            <span className="testimonial-avatar">{initials || "VD"}</span>
            <div className="testimonial-person"><p className="quote-stars" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}<span aria-hidden="true">{"★".repeat(5 - review.rating)}</span></p><p><strong>{review.name}</strong><br />{review.role}</p></div>
            <span className="quote-mark" aria-hidden="true">“</span>
          </div>
          <div className="testimonial-copy">
            <p className="eyebrow"><span /> Client perspective</p>
            <blockquote>“{review.quote}”</blockquote>
            {review.detail && <p>{review.detail}</p>}
            <div className="testimonial-controls">
              <div className="testimonial-arrows">
                <button type="button" aria-label="Previous testimonial" onClick={() => move(-1)} disabled={count < 2}>←</button>
                <button type="button" aria-label="Next testimonial" onClick={() => move(1)} disabled={count < 2}>→</button>
              </div>
              {count > 1 && <div className="testimonial-dots" aria-label="Choose a testimonial">{settings.reviews.map((item, itemIndex) => <button type="button" key={item.id} className={itemIndex === safeIndex ? "is-active" : ""} aria-label={`Show review ${itemIndex + 1}`} aria-current={itemIndex === safeIndex ? "true" : undefined} onClick={() => setIndex(itemIndex)} />)}</div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
