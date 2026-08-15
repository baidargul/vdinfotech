"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { applyTemplateAction, deleteTemplateAction } from "@/app/actions/hero-templates";
import type { HeroTemplateFile } from "@/lib/hero-types";
import { HeroEditorPreview } from "./hero-editor";

function Icon({ name }: { name: "plus" | "edit" | "trash" | "apply" | "active" }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />, edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" /><path d="M10 11v6M14 11v6" /></>,
    apply: <><path d="m5 12 4 4L19 6" /></>, active: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function HeroTemplateLibrary({ templates: initialTemplates, activeTemplateId, activeTemplateRevision }: { templates: HeroTemplateFile[]; activeTemplateId: string | null; activeTemplateRevision: number | null }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedId, setSelectedId] = useState(activeTemplateId && initialTemplates.some((item) => item.id === activeTemplateId) ? activeTemplateId : initialTemplates[0]?.id || "");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const selected = templates.find((template) => template.id === selectedId) || templates[0];

  const apply = () => {
    if (!selected) return;
    const data = new FormData(); data.set("templateId", selected.id); data.set("revision", String(selected.revision));
    startTransition(async () => { const result = await applyTemplateAction({}, data); setNotice(result.message || ""); if (result.success) window.location.reload(); });
  };
  const remove = (template: HeroTemplateFile) => {
    if (!window.confirm(`Delete “${template.name}”? This cannot be undone.`)) return;
    const data = new FormData(); data.set("templateId", template.id);
    startTransition(async () => {
      const result = await deleteTemplateAction({}, data); setNotice(result.message || "");
      if (result.success) { const remaining = templates.filter((item) => item.id !== template.id); setTemplates(remaining); if (selectedId === template.id) { setSelectedId(remaining[0]?.id || ""); setPreviewIndex(0); } }
    });
  };

  return <>
    <div className="hero-library-heading"><div><p className="eyebrow"><span /> Shared creative library</p><h1>Hero templates</h1><p>Select a template to preview it, then apply it when you are ready.</p></div><Link className="hero-library-create" href="/hero-studio/new"><Icon name="plus" /><span>Create template</span></Link></div>
    {notice && <p className="editor-notice hero-library-notice">{notice}</p>}
    {selected ? <section className="hero-library-preview"><HeroEditorPreview settings={selected.carousel} active={previewIndex} playing={playing} setActive={setPreviewIndex} setPlaying={setPlaying} /><aside><span>{selected.id === activeTemplateId ? "CURRENTLY ACTIVE" : "SELECTED TEMPLATE"}</span><h2>{selected.name}</h2><p>{selected.description || "No description provided."}</p><dl><div><dt>Created by</dt><dd>{selected.createdBy.name}</dd></div><div><dt>Last edited</dt><dd>{selected.updatedBy.name} · {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(selected.updatedAt))}</dd></div><div><dt>Revision</dt><dd>{selected.revision}{selected.id === activeTemplateId && activeTemplateRevision ? ` · live r${activeTemplateRevision}` : ""}</dd></div></dl><button type="button" disabled={pending || (selected.id === activeTemplateId && selected.revision === activeTemplateRevision)} onClick={apply}><Icon name={selected.id === activeTemplateId && selected.revision === activeTemplateRevision ? "active" : "apply"} />{selected.id === activeTemplateId && selected.revision === activeTemplateRevision ? "Already active" : "Apply to homepage"}</button></aside></section> : <section className="hero-library-empty"><div>VD</div><h2>Your template library is empty.</h2><p>Create the first reusable homepage hero show.</p><Link href="/hero-studio/new">Create template</Link></section>}
    {templates.length > 0 && <section className="hero-template-grid-section"><header><div><span>TEMPLATE COLLECTION</span><h2>Choose a show</h2></div><strong>{String(templates.length).padStart(2, "0")}</strong></header><div className="hero-template-grid">{templates.map((template) => {
      const cover = template.carousel.slides[0]; const active = template.id === activeTemplateId;
      return <article className={`hero-template-card ${template.id === selected?.id ? "is-selected" : ""}`} key={template.id}>
        <button className="hero-template-select" type="button" onClick={() => { setSelectedId(template.id); setPreviewIndex(0); }}><span className="hero-template-cover">{cover.imageUrl ? <Image src={cover.imageUrl} alt="" fill sizes="320px" unoptimized /> : <span><i>VD</i><b>{cover.accent || cover.title}</b></span>}{active && <em><Icon name="active" /> Active</em>}</span><span className="hero-template-copy"><strong>{template.name}</strong><p>{template.description || "No description"}</p><small>{template.createdBy.name} · edited {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(template.updatedAt))}</small></span></button>
        <div className="hero-template-card-actions"><Link href={`/hero-studio/${template.id}`} title="Edit template" aria-label={`Edit ${template.name}`}><Icon name="edit" /></Link><button type="button" title={active ? "Apply another template before deleting" : "Delete template"} aria-label={`Delete ${template.name}`} disabled={active || pending} onClick={() => remove(template)}><Icon name="trash" /></button></div>
      </article>;
    })}</div></section>}
  </>;
}
