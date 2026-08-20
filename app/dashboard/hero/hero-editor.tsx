"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createTemplateAction, updateTemplateAction, type TemplateActionState } from "@/app/actions/hero-templates";
import { createClientId } from "@/lib/client-id";
import { emptyHeroCta, heroAnimations, heroImageObjectPosition, heroLayouts, type HeroCta, type HeroLayout, type HeroSettingsData, type HeroSlide, type HeroTemplateActivity } from "@/lib/hero-types";

const animationLabels: Record<string, string> = { fade: "Fade", "slide-left": "Slide from right", "slide-right": "Slide from left", "slide-up": "Slide upward", zoom: "Zoom", flip: "Soft flip" };
const layoutLabels: Record<HeroLayout, string> = {
  "split-right": "Content + image", "split-left": "Image + content", "full-bleed": "Full image",
  "overlay-left": "Left overlay", "overlay-right": "Right overlay", "centered-overlay": "Center overlay",
  stacked: "Stacked", "content-only": "Content only", "image-only": "Image only",
};
const layoutDescriptions: Record<HeroLayout, string> = {
  "split-right": "Copy on the left, media on the right", "split-left": "Media on the left, copy on the right",
  "full-bleed": "Edge-to-edge media with a strong bottom caption", "overlay-left": "Full media with copy aligned left",
  "overlay-right": "Full media with copy aligned right", "centered-overlay": "Centered copy over full media",
  stacked: "Wide media above a compact content row", "content-only": "Typography-focused slide without media",
  "image-only": "Pure edge-to-edge visual without copy or CTAs",
};
type InspectorTab = "details" | "layout" | "content" | "media" | "animation" | "ctas" | "history";
type StudioIconName = "play" | "pause" | "left" | "right" | "settings" | "check" | "details" | "layout" | "content" | "media" | "animation" | "link" | "history" | "edit" | "plus" | "trash" | "drag";

function StudioIcon({ name }: { name: StudioIconName }) {
  const paths: Record<StudioIconName, React.ReactNode> = {
    play: <path d="m8 5 11 7-11 7Z" />, pause: <><path d="M9 5v14M15 5v14" /></>,
    left: <path d="m15 18-6-6 6-6" />, right: <path d="m9 18 6-6-6-6" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v.09h-4V21a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4h-.09v-4H3A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1v-.09h4V3a1.7 1.7 0 0 0 1.1 1.6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.14.37.35.71.6 1 .27.27.62.4 1 .4h.09v4H21a1.7 1.7 0 0 0-1.6.6Z" /></>,
    check: <path d="m5 12 4 4L19 6" />, content: <><path d="M4 6h16M4 12h12M4 18h9" /></>,
    details: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    layout: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M12 4v16M3 10h18" /></>,
    media: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 15-5-4L5 20" /></>,
    animation: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" /><circle cx="12" cy="12" r="3" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1" /><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    plus: <path d="M12 5v14M5 12h14" />, trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" /><path d="M10 11v6M14 11v6" /></>,
    drag: <><circle cx="9" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="9" cy="18" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="18" r="1" fill="currentColor" stroke="none" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function SaveButton({ label = "Save & publish" }: { label?: string }) {
  const { pending } = useFormStatus();
  return <button className="editor-submit editor-publish" type="submit" disabled={pending}>{pending ? "Saving..." : label}</button>;
}

function AnimationSelect({ value, onChange }: { value: string; onChange: (value: HeroSlide["enterAnimation"]) => void }) {
  return <select value={value} onChange={(event) => onChange(event.target.value as HeroSlide["enterAnimation"])}>{heroAnimations.map((animation) => <option value={animation} key={animation}>{animationLabels[animation]}</option>)}</select>;
}

function RangeControl({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (value: number) => void }) {
  return <label className="hero-range-control"><span>{label}</span><div><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value))))} /><small>{unit}</small></div></label>;
}

function LayoutGlyph({ layout }: { layout: HeroLayout }) {
  return <span className={`hero-layout-glyph glyph-${layout}`}><i /><b /></span>;
}

function CtaEditor({ title, cta, update }: { title: string; cta: HeroCta; update: (cta: HeroCta) => void }) {
  const set = <K extends keyof HeroCta>(key: K, value: HeroCta[K]) => update({ ...cta, [key]: value });
  return <fieldset className="hero-cta-editor">
    <legend>{title}</legend>
    <label className="editor-field"><span>Button label</span><input value={cta.label} maxLength={50} placeholder="Start a project" onChange={(event) => set("label", event.target.value)} /></label>
    <label className="editor-field"><span>Action</span><select value={cta.type} onChange={(event) => set("type", event.target.value as HeroCta["type"])}><option value="none">No action / hidden</option><option value="url">Open URL, page or blog post</option><option value="section">Jump to page section</option><option value="message">Display a message</option><option value="email">Compose an email</option><option value="phone">Start a phone call</option></select></label>
    {cta.type === "url" && <><label className="editor-field"><span>Internal or external URL</span><input value={cta.target} list="hero-link-targets" placeholder="/blog or https://example.com" onChange={(event) => set("target", event.target.value)} /></label><label className="hero-check"><input type="checkbox" checked={cta.newTab} onChange={(event) => set("newTab", event.target.checked)} /> Open in a new tab</label></>}
    {cta.type === "section" && <label className="editor-field"><span>Section ID</span><input value={cta.target} list="hero-section-targets" placeholder="contact" onChange={(event) => set("target", event.target.value.replace(/^#/, ""))} /><small>Enter the ID without #.</small></label>}
    {cta.type === "message" && <label className="editor-field"><span>Message</span><textarea value={cta.body} rows={3} maxLength={2000} onChange={(event) => set("body", event.target.value)} /></label>}
    {cta.type === "email" && <><label className="editor-field"><span>Email address</span><input type="email" value={cta.target} placeholder="hello@vdinfotech.com" onChange={(event) => set("target", event.target.value)} /></label><label className="editor-field"><span>Subject</span><input value={cta.subject} maxLength={160} onChange={(event) => set("subject", event.target.value)} /></label><label className="editor-field"><span>Prefilled body</span><textarea value={cta.body} rows={3} maxLength={2000} onChange={(event) => set("body", event.target.value)} /></label></>}
    {cta.type === "phone" && <label className="editor-field"><span>Phone number</span><input type="tel" value={cta.target} placeholder="+92 300 123 4567" onChange={(event) => set("target", event.target.value)} /></label>}
  </fieldset>;
}

function PreviewButton({ cta, secondary, onAction }: { cta: HeroCta; secondary?: boolean; onAction: (cta: HeroCta) => void }) {
  if (!cta.label || cta.type === "none") return null;
  return <button className={secondary ? "hero-preview-cta is-secondary" : "hero-preview-cta"} type="button" onClick={() => onAction(cta)}>{cta.label}<span>→</span></button>;
}

function PreviewSlide({ slide }: { slide: HeroSlide }) {
  return <div className={`hero-preview-frame hero-preview-layout-${slide.layout}`}>
    <div className="hero-preview-copy">
      {slide.eyebrow && <small>{slide.eyebrow}</small>}
      {(slide.title || slide.accent) && <h2>{slide.title}{slide.title && slide.accent ? " " : ""}{slide.accent && <em>{slide.accent}</em>}</h2>}
      {slide.subtitle && <strong>{slide.subtitle}</strong>}
      {slide.description && <p>{slide.description}</p>}
    </div>
    <div className="hero-preview-media">{slide.imageUrl ? <Image src={slide.imageUrl} alt={slide.imageAlt} fill sizes="65vw" unoptimized style={{ objectFit: "cover", objectPosition: heroImageObjectPosition(slide) }} /> : <div className="hero-preview-abstract"><i>VD</i><span /><span /><b>Ideas. Engineered.</b></div>}</div>
  </div>;
}

export function HeroEditorPreview({ settings, active, playing, setActive, setPlaying }: { settings: HeroSettingsData; active: number; playing: boolean; setActive: (index: number) => void; setPlaying: (playing: boolean) => void }) {
  const previous = useRef(active);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (previous.current === active) return;
    setOutgoing(previous.current);
    previous.current = active;
    const timer = setTimeout(() => setOutgoing(null), settings.transitionDuration);
    return () => clearTimeout(timer);
  }, [active, settings.transitionDuration]);

  const showAction = (cta: HeroCta) => setNotice(cta.type === "message" ? cta.body : "Action preview only — links are active on the published site.");
  const current = settings.slides[active];
  const enter = current.customAnimation ? current.enterAnimation : settings.globalEnterAnimation;
  return <section className="hero-pro-preview">
    <header><div><span>LIVE PREVIEW</span><small>16:9 · Homepage hero</small></div><div><button type="button" title="Previous slide" onClick={() => setActive((active - 1 + settings.slides.length) % settings.slides.length)} aria-label="Previous preview slide"><StudioIcon name="left" /></button><button className="hero-preview-play" type="button" title={playing ? "Pause" : "Play"} onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause preview" : "Play preview"}><StudioIcon name={playing ? "pause" : "play"} /></button><button type="button" title="Next slide" onClick={() => setActive((active + 1) % settings.slides.length)} aria-label="Next preview slide"><StudioIcon name="right" /></button></div></header>
    <div className="hero-preview-stage" style={{ "--hero-transition": `${settings.transitionDuration}ms` } as React.CSSProperties}>
      {outgoing !== null && settings.slides[outgoing] && <div className={`hero-preview-layer preview-layout-${settings.slides[outgoing].layout} is-outgoing hero-exit-${settings.slides[outgoing].customAnimation ? settings.slides[outgoing].exitAnimation : settings.globalExitAnimation}`}><PreviewSlide slide={settings.slides[outgoing]} /></div>}
      <div className={`hero-preview-layer preview-layout-${current.layout} is-current hero-enter-${enter}`} key={`${current.id}-${active}`}><PreviewSlide slide={current} /><div className="hero-preview-actions"><PreviewButton cta={current.primaryCta} onAction={showAction} /><PreviewButton cta={current.secondaryCta} secondary onAction={showAction} /></div></div>
      {settings.showArrows && settings.slides.length > 1 && <div className="hero-preview-stage-arrows"><button type="button" onClick={() => setActive((active - 1 + settings.slides.length) % settings.slides.length)} aria-label="Previous slide"><StudioIcon name="left" /></button><button type="button" onClick={() => setActive((active + 1) % settings.slides.length)} aria-label="Next slide"><StudioIcon name="right" /></button></div>}
      {settings.showDots && settings.slides.length > 1 && <div className="hero-preview-dots">{settings.slides.map((slide, index) => <button className={index === active ? "is-active" : ""} type="button" onClick={() => setActive(index)} aria-label={`Preview slide ${index + 1}`} key={slide.id} />)}</div>}
      {notice && <div className="hero-preview-notice"><p>{notice}</p><button type="button" onClick={() => setNotice("")}>Close</button></div>}
    </div>
    <footer><span>Slide {String(active + 1).padStart(2, "0")} / {String(settings.slides.length).padStart(2, "0")}</span><span>{layoutLabels[current.layout]} · {settings.heroHeight}px · {animationLabels[enter]} · {(settings.interval / 1000).toFixed(1)}s</span></footer>
  </section>;
}

function newSlide(): HeroSlide {
  return { id: createClientId(), layout: "split-right", eyebrow: "", title: "New slide title", accent: "", subtitle: "", description: "", imageId: "", imageUrl: "", imageAlt: "", imagePosition: "center", imageOffsetX: 0, imageOffsetY: 0, customAnimation: false, enterAnimation: "fade", exitAnimation: "fade", primaryCta: emptyHeroCta(), secondaryCta: emptyHeroCta() };
}

type HeroEditorProps = { initialSettings: HeroSettingsData; template?: { id: string; revision: number; name: string; description: string; activity: HeroTemplateActivity[] } };

export function HeroEditor({ initialSettings, template }: HeroEditorProps) {
  const [settings, setSettings] = useState(initialSettings);
  const serverAction = template ? updateTemplateAction : createTemplateAction;
  const [state, action] = useActionState(serverAction, {} as TemplateActionState);
  const [templateName, setTemplateName] = useState(template?.name || "Untitled hero template");
  const [templateDescription, setTemplateDescription] = useState(template?.description || "");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [playing, setPlaying] = useState(initialSettings.autoplay);
  const [inspectorMode, setInspectorMode] = useState<"slide" | "settings">("slide");
  const [tab, setTab] = useState<InspectorTab>(template ? "content" : "details");
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ index: number; after: boolean } | null>(null);
  const [linkTargets, setLinkTargets] = useState<{ title: string; url: string; type: string }[]>([]);
  const timeline = useRef<HTMLDivElement>(null);
  const initialMediaIds = useRef(new Set(initialSettings.slides.map((slide) => slide.imageId).filter(Boolean)));

  useEffect(() => { if (state.success) window.scrollTo({ top: 0, behavior: "smooth" }); }, [state.success]);
  useEffect(() => { fetch("/api/link-targets").then((response) => response.ok ? response.json() : { targets: [] }).then((result) => setLinkTargets(result.targets || [])).catch(() => setLinkTargets([])); }, []);
  useEffect(() => {
    if (!playing || settings.slides.length < 2) return;
    const timer = setTimeout(() => setPreviewIndex((index) => (index + 1) % settings.slides.length), settings.interval);
    return () => clearTimeout(timer);
  }, [playing, previewIndex, settings.interval, settings.slides.length]);

  const updateSettings = <K extends keyof HeroSettingsData>(key: K, value: HeroSettingsData[K]) => setSettings((current) => ({ ...current, [key]: value }));
  const updateSlide = (index: number, values: Partial<HeroSlide>) => setSettings((current) => ({ ...current, slides: current.slides.map((slide, slideIndex) => slideIndex === index ? { ...slide, ...values } : slide) }));
  const selectSlide = (index: number) => { setSelectedIndex(index); setPreviewIndex(index); setInspectorMode("slide"); };
  const selectedSlide = settings.slides[selectedIndex];

  const uploadImage = async (index: number, file: File) => {
    setUploading(index); setUploadError("");
    const data = new FormData(); data.set("image", file); data.set("altText", settings.slides[index].imageAlt || "Hero slide image");
    try {
      const response = await fetch("/api/media", { method: "POST", body: data }); const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Image upload failed.");
      const previous = settings.slides[index];
      if (previous.imageId && !initialMediaIds.current.has(previous.imageId)) await fetch(`/api/media/${previous.imageId}`, { method: "DELETE" });
      updateSlide(index, { imageId: result.id, imageUrl: result.url, imageAlt: previous.imageAlt || result.altText || "Hero slide image" });
    } catch (error) { setUploadError(error instanceof Error ? error.message : "Image upload failed."); } finally { setUploading(null); }
  };

  const removeSlide = async (index: number) => {
    if (settings.slides.length === 1) return;
    const slide = settings.slides[index];
    if (slide.imageId && !initialMediaIds.current.has(slide.imageId)) await fetch(`/api/media/${slide.imageId}`, { method: "DELETE" });
    const nextIndex = Math.max(0, index - 1);
    setSettings((current) => ({ ...current, slides: current.slides.filter((_, slideIndex) => slideIndex !== index) }));
    setSelectedIndex(nextIndex); setPreviewIndex(nextIndex);
  };

  const moveSlide = (index: number, direction: number) => {
    const next = index + direction; if (next < 0 || next >= settings.slides.length) return;
    const slides = [...settings.slides]; [slides[index], slides[next]] = [slides[next], slides[index]];
    updateSettings("slides", slides); setSelectedIndex(next); setPreviewIndex(next);
  };

  const dropSlide = (targetIndex: number, after: boolean) => {
    if (dragIndex === null) return;
    const slides = [...settings.slides];
    const [moved] = slides.splice(dragIndex, 1);
    let destination = targetIndex + (after ? 1 : 0);
    if (dragIndex < destination) destination -= 1;
    destination = Math.max(0, Math.min(destination, slides.length));
    slides.splice(destination, 0, moved);
    updateSettings("slides", slides); setSelectedIndex(destination); setPreviewIndex(destination);
    setDragIndex(null); setDropTarget(null);
  };

  const addSlide = () => {
    if (settings.slides.length >= 10) return;
    const next = settings.slides.length;
    updateSettings("slides", [...settings.slides, newSlide()]); setSelectedIndex(next); setPreviewIndex(next); setInspectorMode("slide"); setTab("content");
    requestAnimationFrame(() => timeline.current?.scrollTo({ left: timeline.current.scrollWidth, behavior: "smooth" }));
  };

  return <form action={action} className="hero-editor-form hero-pro-form">
    <input type="hidden" name="settings" value={JSON.stringify(settings)} />
    <input type="hidden" name="templateId" value={template?.id || ""} />
    <input type="hidden" name="revision" value={template?.revision || ""} />
    <input type="hidden" name="name" value={templateName} />
    <input type="hidden" name="description" value={templateDescription} />
    <datalist id="hero-link-targets">{linkTargets.map((target) => <option value={target.url} label={`${target.title} · ${target.type}`} key={target.url} />)}</datalist>
    <datalist id="hero-section-targets"><option value="about" /><option value="services" /><option value="work" /><option value="process" /><option value="contact" /></datalist>
    <div className="hero-studio-actions"><Link href="/dashboard/hero"><StudioIcon name="left" /> Back</Link><SaveButton label="Save template" /></div>
    {state.message && <p className={`editor-notice ${state.success ? "is-success" : ""}`}>{state.message}{state.errors?.length ? ` ${state.errors.join(" ")}` : ""}</p>}
    {uploadError && <p className="editor-notice">{uploadError}</p>}

    <div className="hero-pro-workspace">
      <HeroEditorPreview settings={settings} active={previewIndex} playing={playing} setActive={setPreviewIndex} setPlaying={setPlaying} />

      <aside className="hero-pro-inspector">
        <header><div><span>{inspectorMode === "settings" ? "SHOW SETTINGS" : `SLIDE ${String(selectedIndex + 1).padStart(2, "0")}`}</span><h2>{inspectorMode === "settings" ? "Playback & transitions" : selectedSlide.title || selectedSlide.subtitle || "Untitled slide"}</h2></div>{inspectorMode === "settings" && <button type="button" title="Done" aria-label="Close show settings" onClick={() => setInspectorMode("slide")}><StudioIcon name="check" /></button>}</header>
        {inspectorMode === "settings" ? <div className="hero-inspector-scroll hero-settings-inspector">
          <label className="editor-field"><span>Enter animation</span><AnimationSelect value={settings.globalEnterAnimation} onChange={(value) => updateSettings("globalEnterAnimation", value)} /></label>
          <label className="editor-field"><span>Exit animation</span><AnimationSelect value={settings.globalExitAnimation} onChange={(value) => updateSettings("globalExitAnimation", value)} /></label>
          <label className="editor-field"><span>Slide interval (seconds)</span><input type="number" min="2.5" max="30" step="0.5" value={settings.interval / 1000} onChange={(event) => updateSettings("interval", Math.round(Number(event.target.value) * 1000))} /></label>
          <label className="editor-field"><span>Transition (milliseconds)</span><input type="number" min="200" max="2000" step="50" value={settings.transitionDuration} onChange={(event) => updateSettings("transitionDuration", Number(event.target.value))} /></label>
          <div className="hero-inspector-toggles">{[["autoplay", "Autoplay on published site"], ["pauseOnHover", "Pause on hover"], ["showArrows", "Show navigation arrows"], ["showDots", "Show pagination dots"]].map(([key, label]) => <label className="hero-check" key={key}><input type="checkbox" checked={settings[key as keyof HeroSettingsData] as boolean} onChange={(event) => updateSettings(key as "autoplay", event.target.checked)} /> {label}</label>)}</div>
        </div> : <>
          <nav className="hero-inspector-tabs" aria-label="Template properties">{(["details", "layout", "content", "media", "animation", "ctas", ...(template ? ["history" as const] : [])] as InspectorTab[]).map((item) => <button className={tab === item ? "is-active" : ""} type="button" title={item === "ctas" ? "Call-to-action buttons" : item.charAt(0).toUpperCase() + item.slice(1)} onClick={() => setTab(item)} aria-label={item === "ctas" ? "Call-to-action buttons" : item} aria-pressed={tab === item} key={item}><StudioIcon name={item === "ctas" ? "link" : item} /></button>)}</nav>
          <div className="hero-inspector-scroll">
            {tab === "details" && <div className="hero-inspector-section"><label className="editor-field"><span>Template name</span><input value={templateName} maxLength={100} onChange={(event) => setTemplateName(event.target.value)} /></label><label className="editor-field"><span>Description</span><textarea value={templateDescription} rows={7} maxLength={500} placeholder="Explain when this template should be used." onChange={(event) => setTemplateDescription(event.target.value)} /></label>{template && <p className="hero-inspector-hint">Revision {template.revision}. Saving creates a new revision and records your edit in History.</p>}</div>}
            {tab === "layout" && <div className="hero-inspector-section">
              <div className="hero-layout-height"><RangeControl label="Exact desktop hero height" value={settings.heroHeight} min={520} max={1000} step={10} unit="px" onChange={(value) => updateSettings("heroHeight", value)} /><div className="hero-height-presets">{[520, 720, 760, 900, 1000].map((height) => <button className={settings.heroHeight === height ? "is-active" : ""} type="button" onClick={() => updateSettings("heroHeight", height)} key={height}>{height}</button>)}</div><small>Current: {settings.heroHeight}px. Save the template, then Apply it to update the desktop homepage. Mobile height stays responsive.</small></div>
              <div className="hero-layout-picker">{heroLayouts.map((layout) => <button className={selectedSlide.layout === layout ? "is-active" : ""} type="button" onClick={() => updateSlide(selectedIndex, { layout })} aria-pressed={selectedSlide.layout === layout} key={layout}><LayoutGlyph layout={layout} /><span><strong>{layoutLabels[layout]}</strong><small>{layoutDescriptions[layout]}</small></span></button>)}</div>
              {selectedSlide.layout === "image-only" && !selectedSlide.imageId && <p className="editor-notice">Upload an image or GIF in the Media tab for an image-only slide.</p>}
            </div>}
            {tab === "content" && <div className="hero-inspector-section"><label className="editor-field"><span>Eyebrow</span><input value={selectedSlide.eyebrow} maxLength={80} onChange={(event) => updateSlide(selectedIndex, { eyebrow: event.target.value })} /></label><label className="editor-field"><span>Title</span><input value={selectedSlide.title} maxLength={140} onChange={(event) => updateSlide(selectedIndex, { title: event.target.value })} /></label><label className="editor-field"><span>Accent title</span><input value={selectedSlide.accent} maxLength={100} onChange={(event) => updateSlide(selectedIndex, { accent: event.target.value })} /></label><label className="editor-field"><span>Subtitle</span><input value={selectedSlide.subtitle} maxLength={120} onChange={(event) => updateSlide(selectedIndex, { subtitle: event.target.value })} /></label><label className="editor-field"><span>Description</span><textarea value={selectedSlide.description} rows={6} maxLength={420} onChange={(event) => updateSlide(selectedIndex, { description: event.target.value })} /></label></div>}
            {tab === "media" && <div className="hero-inspector-section">
              <div className="hero-inspector-media">{selectedSlide.imageUrl ? <Image src={selectedSlide.imageUrl} alt={selectedSlide.imageAlt} width={500} height={280} unoptimized style={{ objectPosition: heroImageObjectPosition(selectedSlide) }} /> : <span>Branded abstract visual</span>}</div>
              <label className="hero-upload-button">{uploading === selectedIndex ? "Uploading..." : selectedSlide.imageUrl ? "Replace image / GIF" : "Upload image / GIF"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden disabled={uploading === selectedIndex} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(selectedIndex, file); event.target.value = ""; }} /></label>
              {selectedSlide.imageUrl && <button className="hero-inspector-remove-media" type="button" onClick={() => updateSlide(selectedIndex, { imageId: "", imageUrl: "" })}>Use abstract visual</button>}
              <label className="editor-field"><span>Alternative text</span><input value={selectedSlide.imageAlt} maxLength={180} onChange={(event) => updateSlide(selectedIndex, { imageAlt: event.target.value })} /></label>
              <label className="editor-field"><span>Image focus preset</span><select value={selectedSlide.imagePosition} onChange={(event) => updateSlide(selectedIndex, { imagePosition: event.target.value as HeroSlide["imagePosition"] })}><option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option></select></label>
              <RangeControl label="Horizontal offset" value={selectedSlide.imageOffsetX} min={-50} max={50} unit="%" onChange={(imageOffsetX) => updateSlide(selectedIndex, { imageOffsetX })} />
              <RangeControl label="Vertical offset" value={selectedSlide.imageOffsetY} min={-50} max={50} unit="%" onChange={(imageOffsetY) => updateSlide(selectedIndex, { imageOffsetY })} />
              {(selectedSlide.imageOffsetX !== 0 || selectedSlide.imageOffsetY !== 0) && <button className="hero-inspector-reset" type="button" onClick={() => updateSlide(selectedIndex, { imageOffsetX: 0, imageOffsetY: 0 })}>Reset image offsets</button>}
              <small>JPEG, PNG, WebP or animated GIF · max 5 MB</small>
            </div>}
            {tab === "animation" && <div className="hero-inspector-section"><label className="hero-check"><input type="checkbox" checked={selectedSlide.customAnimation} onChange={(event) => updateSlide(selectedIndex, { customAnimation: event.target.checked })} /> Override global animations</label>{selectedSlide.customAnimation ? <><label className="editor-field"><span>Enter animation</span><AnimationSelect value={selectedSlide.enterAnimation} onChange={(value) => updateSlide(selectedIndex, { enterAnimation: value })} /></label><label className="editor-field"><span>Exit animation</span><AnimationSelect value={selectedSlide.exitAnimation} onChange={(value) => updateSlide(selectedIndex, { exitAnimation: value })} /></label></> : <p className="hero-inspector-hint">This slide uses the global {animationLabels[settings.globalEnterAnimation]} enter and {animationLabels[settings.globalExitAnimation]} exit effects.</p>}</div>}
            {tab === "ctas" && <div className="hero-inspector-section"><CtaEditor title="Primary CTA" cta={selectedSlide.primaryCta} update={(primaryCta) => updateSlide(selectedIndex, { primaryCta })} /><CtaEditor title="Secondary CTA" cta={selectedSlide.secondaryCta} update={(secondaryCta) => updateSlide(selectedIndex, { secondaryCta })} /></div>}
            {tab === "history" && template && <div className="hero-history-list">{[...template.activity].reverse().map((entry) => <article key={entry.id}><span className={`history-${entry.action}`}><StudioIcon name={entry.action === "applied" ? "check" : entry.action === "created" ? "plus" : "edit"} /></span><div><strong>{entry.user.name}</strong><p>{entry.action === "created" ? "created the template" : entry.action === "edited" ? `saved revision ${entry.revision}` : `applied revision ${entry.revision}`}</p><time>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.at))}</time></div></article>)}</div>}
          </div>
        </>}
      </aside>

      <section className="hero-pro-timeline">
        <header><div className="hero-timeline-transport"><button type="button" title={playing ? "Pause" : "Play"} aria-label={playing ? "Pause timeline" : "Play timeline"} onClick={() => setPlaying(!playing)}><StudioIcon name={playing ? "pause" : "play"} /></button><button type="button" title="Previous slide" aria-label="Select previous slide" onClick={() => selectSlide(Math.max(0, selectedIndex - 1))}><StudioIcon name="left" /></button><button type="button" title="Next slide" aria-label="Select next slide" onClick={() => selectSlide(Math.min(settings.slides.length - 1, selectedIndex + 1))}><StudioIcon name="right" /></button></div><div><strong>SHOW TIMELINE</strong><span>{selectedIndex + 1} / {settings.slides.length}</span></div><button className={inspectorMode === "settings" ? "is-active" : ""} type="button" title="Show settings" aria-label="Show carousel settings" onClick={() => setInspectorMode("settings")}><StudioIcon name="settings" /></button></header>
        <div className="hero-storyboard-scroll" ref={timeline}><div className="hero-storyboard" role="tablist" aria-label="Hero slides">
          {settings.slides.map((slide, index) => <div
            className={`hero-storyboard-step hero-draggable-step ${dragIndex === index ? "is-dragging" : ""} ${dropTarget?.index === index ? (dropTarget.after ? "drop-after" : "drop-before") : ""}`}
            draggable
            onDragStart={(event) => { setDragIndex(index); selectSlide(index); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", slide.id); }}
            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; const rect = event.currentTarget.getBoundingClientRect(); setDropTarget({ index, after: event.clientX > rect.left + rect.width / 2 }); }}
            onDrop={(event) => { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); dropSlide(index, event.clientX > rect.left + rect.width / 2); }}
            onDragEnd={() => { setDragIndex(null); setDropTarget(null); }}
            key={slide.id}
          ><div className={`hero-story-card ${selectedIndex === index ? "is-selected" : ""} ${previewIndex === index ? "is-playhead" : ""}`}><span className="hero-drag-handle" title="Drag to reorder"><StudioIcon name="drag" /></span><button className="hero-story-select" type="button" role="tab" aria-selected={selectedIndex === index} aria-label={`Edit slide ${index + 1}: ${slide.title || "Untitled slide"}`} onClick={() => selectSlide(index)} onKeyDown={(event) => { if (event.altKey && event.key === "ArrowLeft") moveSlide(index, -1); if (event.altKey && event.key === "ArrowRight") moveSlide(index, 1); }}><span className="hero-story-number">{String(index + 1).padStart(2, "0")}</span><span className={`hero-story-thumb story-layout-${slide.layout}`}>{slide.imageUrl ? <Image src={slide.imageUrl} alt="" width={320} height={180} unoptimized /> : <span><i>VD</i><b>{slide.accent || slide.title || "New slide"}</b></span>}<em><LayoutGlyph layout={slide.layout} /></em></span><span className="hero-story-meta"><strong>{slide.title || slide.subtitle || layoutLabels[slide.layout]}</strong><small>{(settings.interval / 1000).toFixed(1)}s · {layoutLabels[slide.layout]}</small></span></button><button className="hero-card-delete" type="button" title="Delete slide" aria-label={`Delete slide ${index + 1}`} disabled={settings.slides.length === 1} onClick={() => void removeSlide(index)}><StudioIcon name="trash" /></button></div>{index < settings.slides.length - 1 && <span className="hero-transition-bridge"><i>→</i><small>{slide.customAnimation ? slide.exitAnimation : settings.globalExitAnimation}</small></span>}</div>)}
          <button className="hero-story-add" type="button" title="Add slide" aria-label="Add slide" disabled={settings.slides.length >= 10} onClick={addSlide}><span><StudioIcon name="plus" /></span><small>{settings.slides.length >= 10 ? "Limit" : "Add"}</small></button>
        </div></div>
        <footer><span className="hero-timeline-tip"><StudioIcon name="drag" /> Drag cards to reorder</span><span>{String(settings.slides.length).padStart(2, "0")} slides · {(settings.slides.length * settings.interval / 1000).toFixed(1)}s</span></footer>
      </section>
    </div>
  </form>;
}
