"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { heroImageObjectPosition, type HeroCta, type HeroSettingsData, type HeroSlide } from "@/lib/hero-types";

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

function ctaHref(cta: HeroCta) {
  if (cta.type === "section") return `#${cta.target.replace(/^#/, "")}`;
  if (cta.type === "email") return `mailto:${cta.target}?${new URLSearchParams({ ...(cta.subject ? { subject: cta.subject } : {}), ...(cta.body ? { body: cta.body } : {}) })}`;
  if (cta.type === "phone") return `tel:${cta.target.replace(/[^+\d]/g, "")}`;
  return cta.target;
}

function HeroButton({ cta, secondary, showMessage, previewAction }: { cta: HeroCta; secondary?: boolean; showMessage: (message: string) => void; previewAction?: (cta: HeroCta) => void }) {
  if (!cta.label || cta.type === "none") return null;
  const className = secondary ? "text-link light-link hero-cta-secondary" : "button button-mint";
  if (previewAction) return <button className={className} type="button" onClick={() => previewAction(cta)}>{cta.label}<ArrowIcon /></button>;
  if (cta.type === "message") return <button className={className} type="button" onClick={() => showMessage(cta.body)}>{cta.label}<ArrowIcon /></button>;
  const external = cta.type === "url" && /^https?:\/\//i.test(cta.target);
  return <a className={className} href={ctaHref(cta)} target={cta.newTab ? "_blank" : undefined} rel={cta.newTab || external ? "noopener noreferrer" : undefined}>{cta.label}<ArrowIcon /></a>;
}

function AbstractVisual() {
  return <div className="hero-visual hero-abstract" aria-label="Abstract representation of connected digital products">
    <div className="hero-grid" /><div className="code-window"><div className="window-dots"><i /><i /><i /></div><div className="code-lines"><i /><i /><i /><i /><i /></div></div>
    <div className="orbit orbit-one"><span>UI</span></div><div className="orbit orbit-two"><span>API</span></div><div className="orbit orbit-three"><span>01</span></div>
    <div className="floating-note"><span className="hero-spark">✦</span><span>Built to scale<br /><strong>from day one.</strong></span></div>
  </div>;
}

export function HeroSlideView({ slide, showMessage, previewAction }: { slide: HeroSlide; showMessage: (message: string) => void; previewAction?: (cta: HeroCta) => void }) {
  return <div className={`hero-content shell hero-layout-frame hero-layout-${slide.layout}`}>
    <div className="hero-copy">
      {slide.eyebrow && <p className="eyebrow light"><span />{slide.eyebrow}</p>}
      {(slide.title || slide.accent) && <h1>{slide.title}{slide.title && slide.accent ? " " : ""}{slide.accent && <em>{slide.accent}</em>}</h1>}
      {slide.subtitle && <p className="hero-subtitle">{slide.subtitle}</p>}
      {slide.description && <p className="hero-lead">{slide.description}</p>}
      <div className="hero-actions">
        <HeroButton cta={slide.primaryCta} showMessage={showMessage} previewAction={previewAction} />
        <HeroButton cta={slide.secondaryCta} secondary showMessage={showMessage} previewAction={previewAction} />
      </div>
    </div>
    {slide.imageUrl ? <div className="hero-visual hero-media"><Image src={slide.imageUrl} alt={slide.imageAlt} fill sizes="(max-width: 760px) 100vw, 45vw" unoptimized style={{ objectFit: "cover", objectPosition: heroImageObjectPosition(slide) }} /></div> : <AbstractVisual />}
  </div>;
}

export function HeroCarousel({ settings }: { settings: HeroSettingsData }) {
  const [active, setActive] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [paused, setPaused] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slides = settings.slides;

  const goTo = useCallback((next: number) => {
    if (slides.length < 2 || next === active || outgoing !== null) return;
    setOutgoing(active);
    setActive((next + slides.length) % slides.length);
    transitionTimer.current = setTimeout(() => setOutgoing(null), settings.transitionDuration);
  }, [active, outgoing, settings.transitionDuration, slides.length]);

  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current); }, []);
  useEffect(() => {
    if (!settings.autoplay || paused || slides.length < 2 || outgoing !== null) return;
    const timer = setTimeout(() => goTo(active + 1), settings.interval);
    return () => clearTimeout(timer);
  }, [active, goTo, outgoing, paused, settings.autoplay, settings.interval, slides.length]);

  if (!slides.length) return null;
  return <section
    className="hero hero-carousel"
    id="home"
    aria-roledescription="carousel"
    aria-label="Featured content"
    onMouseEnter={() => settings.pauseOnHover && setPaused(true)}
    onMouseLeave={() => setPaused(false)}
    style={{ "--hero-transition": `${settings.transitionDuration}ms`, "--hero-height": `${settings.heroHeight}px` } as React.CSSProperties}
  >
    <div className="hero-slides">
      {slides.map((slide, index) => {
        const isActive = index === active;
        const isOutgoing = index === outgoing;
        if (!isActive && !isOutgoing) return null;
        const enter = slide.customAnimation ? slide.enterAnimation : settings.globalEnterAnimation;
        const exit = slide.customAnimation ? slide.exitAnimation : settings.globalExitAnimation;
        return <article
          className={`hero-slide hero-layout-${slide.layout} ${isOutgoing ? `is-exiting hero-exit-${exit}` : `is-active hero-enter-${enter}`}`}
          aria-hidden={!isActive}
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${slides.length}`}
          key={slide.id}
        >
          <HeroSlideView slide={slide} showMessage={setMessage} />
        </article>;
      })}
    </div>
    {slides.length > 1 && settings.showArrows && <div className="hero-controls shell">
      <button type="button" onClick={() => goTo(active - 1)} aria-label="Previous slide">←</button>
      <button type="button" onClick={() => goTo(active + 1)} aria-label="Next slide">→</button>
    </div>}
    {slides.length > 1 && settings.showDots && <div className="hero-dots" role="group" aria-label="Choose a slide">
      {slides.map((slide, index) => <button className={index === active ? "is-active" : ""} type="button" onClick={() => goTo(index)} aria-label={`Go to slide ${index + 1}`} aria-current={index === active ? "true" : undefined} key={slide.id} />)}
    </div>}
    {message && <div className="hero-message-backdrop" role="presentation" onMouseDown={() => setMessage("")}>
      <div className="hero-message" role="dialog" aria-modal="true" aria-labelledby="hero-message-title" onMouseDown={(event) => event.stopPropagation()}>
        <span aria-hidden="true">✦</span><h2 id="hero-message-title">A message for you</h2><p>{message}</p><button type="button" onClick={() => setMessage("")}>Close</button>
      </div>
    </div>}
  </section>;
}
