"use client";

import { FormEvent, useState } from "react";
import { usePathname } from "next/navigation";
import { createLeadAction, type LeadActionState } from "@/app/actions/leads";
import type { ContactWidgetSettingsData } from "@/lib/contact-widget-settings";
import { saveVisitorProfile, useVisitorProfile } from "./visitor-profile";

function ChatIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.3-4.6A7 7 0 0 1 3 13V8a5 5 0 0 1 5-5h9a4 4 0 0 1 4 4Z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>;
}

export function LeadWidget({ settings }: { settings: ContactWidgetSettingsData }) {
  const pathname = usePathname();
  const profile = useVisitorProfile();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [state, setState] = useState<LeadActionState>({});
  const isPublicPage = pathname === "/" || pathname.startsWith("/blog");
  if (!isPublicPage || !settings.enabled) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setPending(true);
    setState({});
    const data = new FormData(form);
    const visitorId = profile.visitorId || crypto.randomUUID();
    data.set("visitorId", visitorId);
    data.set("source", "chat-widget");
    data.set("pageUrl", window.location.href);
    const result = await createLeadAction(data);
    setPending(false);
    setState(result);
    if (!result.success) return;
    saveVisitorProfile({
      visitorId,
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      company: String(data.get("company") ?? ""),
    });
    setSent(true);
    setOpen(false);
  };

  return <div className={`lead-widget${open ? " is-open" : ""}`}>
    {open && <section className="lead-widget-panel" role="dialog" aria-modal="false" aria-labelledby="lead-widget-title">
      <div className="lead-widget-intro">
        <button className="lead-widget-close" type="button" aria-label="Close enquiry panel" onClick={() => setOpen(false)}>×</button>
        <span className="lead-widget-kicker">{settings.kicker}</span>
        <h2 id="lead-widget-title">{settings.heading} <span aria-hidden="true">👋</span></h2>
        <p>{settings.description}</p>
      </div>
      <form className="lead-widget-form" key={profile.visitorId || "new-visitor"} onSubmit={submit}>
        <input className="lead-honeypot" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <div className="lead-widget-row">
          <label><span>Your name</span><input name="name" defaultValue={profile.name} autoComplete="name" required maxLength={80} placeholder="Jane Smith" /></label>
          <label><span>Work email</span><input name="email" type="email" defaultValue={profile.email} autoComplete="email" required maxLength={160} placeholder="jane@company.com" /></label>
        </div>
        <div className="lead-widget-row">
          <label><span>Phone number</span><input name="phone" type="tel" defaultValue={profile.phone} autoComplete="tel" required maxLength={24} placeholder="+91 98765 43210" /></label>
          <label><span>Company</span><input name="company" defaultValue={profile.company} autoComplete="organization" maxLength={120} placeholder="Company name" /></label>
        </div>
        <label><span>How can we help?</span><textarea name="message" rows={3} maxLength={1500} placeholder="A short overview of your requirement…" /></label>
        {state.message && !state.success && <p className="lead-widget-error" role="alert">{state.message}</p>}
        {state.errors && <p className="lead-widget-error" role="alert">{Object.values(state.errors).flat()[0]}</p>}
        <button className="lead-widget-submit" type="submit" disabled={pending}>{pending ? "Sending…" : <>{settings.buttonLabel} <span aria-hidden="true">→</span></>}</button>
        <small>By submitting, you agree to be contacted about your enquiry.</small>
      </form>
    </section>}
    <button className={sent ? "lead-widget-trigger is-sent" : "lead-widget-trigger"} type="button" aria-label={open ? "Close enquiry panel" : "Open enquiry panel"} aria-expanded={open} onClick={() => { setOpen((current) => !current); setSent(false); }}>
      {open ? <span aria-hidden="true">×</span> : sent ? <span aria-hidden="true">✓</span> : <ChatIcon />}
    </button>
  </div>;
}
