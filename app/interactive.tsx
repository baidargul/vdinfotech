"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { createLeadAction, type LeadActionState } from "@/app/actions/leads";
import { saveVisitorProfile, useVisitorProfile } from "./visitor-profile";

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="site-header">
      <div className="shell nav-wrap">
        <Link className="brand" href="/" aria-label="VD Infotech home" onClick={close}><span className="brand-mark">VD</span><span><strong>VD INFOTECH</strong><small>Ideas. Engineered.</small></span></Link>
        <nav className={open ? "nav-links is-open" : "nav-links"} aria-label="Primary navigation">
          <Link href="/#about" onClick={close}>About</Link><Link href="/#services" onClick={close}>Services</Link><Link href="/#work" onClick={close}>Work</Link><Link href="/#process" onClick={close}>Process</Link><Link href="/blog" onClick={close}>Blog</Link>
          <Link className="nav-mobile-login" href="/login" onClick={close}>Login</Link>
          <Link className="nav-mobile-cta" href="/#contact" onClick={close}>Let&apos;s talk <ArrowIcon /></Link>
        </nav>
        <div className="nav-actions"><a className="social-link" href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">in</a><Link className="nav-login" href="/login">Login</Link><Link className="nav-cta" href="/#contact">Let&apos;s talk <ArrowIcon /></Link></div>
        <button className={open ? "menu-button is-open" : "menu-button"} type="button" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}><span /><span /></button>
      </div>
    </header>
  );
}

type Service = { icon: "code" | "mobile" | "ai" | "cloud" | "team"; number: string; title: string; text: string };
function ServiceIcon({ name }: { name: Service["icon"] }) {
  const iconPaths = {
    code: <><path d="m8.5 9-3 3 3 3M15.5 9l3 3-3 3M13 6l-2 12" /></>,
    mobile: <><rect width="11" height="18" x="6.5" y="3" rx="2" /><path d="M10 6h4M11 18h2" /></>,
    ai: <><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4" /><path d="m10 13 1.4-3 1.4 3M10.5 12h1.8M14.5 10v3" /></>,
    cloud: <path d="M17.5 19H7a5 5 0 1 1 1.1-9.9A6.5 6.5 0 0 1 20.4 11 4 4 0 0 1 17.5 19Z" />,
    team: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
}

export function ServiceRail({ services }: { services: Service[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => rail.current?.scrollBy({ left: direction * 300, behavior: "smooth" });
  return <div className="rail-area"><div className="service-rail" ref={rail}>{services.map((service) => <article className="service-card" key={service.title}><span className="service-number">{service.number}</span><div className="service-icon"><ServiceIcon name={service.icon} /></div><h3>{service.title}</h3><p>{service.text}</p><a href="#contact" aria-label={`Discuss ${service.title}`}>Learn more <ArrowIcon /></a></article>)}</div><div className="rail-controls"><button type="button" aria-label="Previous services" onClick={() => scroll(-1)}>←</button><button type="button" aria-label="Next services" onClick={() => scroll(1)}>→</button></div></div>;
}

export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  const [active, setActive] = useState(0);
  return <div className="faq-list">{items.map((item, index) => { const isOpen = active === index; return <article className={isOpen ? "faq-item is-open" : "faq-item"} key={item.question}><button type="button" onClick={() => setActive(isOpen ? -1 : index)} aria-expanded={isOpen}><span>{item.question}</span><i>{isOpen ? "−" : "+"}</i></button><div className="faq-answer" aria-hidden={!isOpen}><p>{item.answer}</p></div></article>; })}</div>;
}

export function ContactForm() {
  const profile = useVisitorProfile();
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<LeadActionState>({});
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setPending(true);
    setState({});
    const data = new FormData(form);
    const visitorId = profile.visitorId || crypto.randomUUID();
    data.set("visitorId", visitorId);
    data.set("source", "contact-form");
    data.set("pageUrl", window.location.href);
    const result = await createLeadAction(data);
    setPending(false);
    setState(result);
    if (!result.success) return;
    saveVisitorProfile({ visitorId, name: String(data.get("name") ?? ""), email: String(data.get("email") ?? ""), phone: profile.phone, company: profile.company });
    setSubmitted(true);
  };
  if (submitted) return <div className="form-success" role="status"><span>✓</span><h3>Thank you. We&apos;re on it.</h3><p>Your enquiry has reached our team. We&apos;ll get back to you within one business day.</p><button type="button" onClick={() => setSubmitted(false)}>Send another message</button></div>;
  return <form className="contact-form" key={profile.visitorId || "contact-guest"} onSubmit={submit}><input className="lead-honeypot" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" /><div className="form-row"><label><span>Your name</span><input name="name" type="text" defaultValue={profile.name} autoComplete="name" placeholder="Jane Smith" required /></label><label><span>Work email</span><input name="email" type="email" defaultValue={profile.email} autoComplete="email" placeholder="jane@company.com" required /></label></div><label><span>What can we help with?</span><select name="service" defaultValue="" required><option value="" disabled>Select a service</option><option>Web development</option><option>Mobile application</option><option>AI integrations</option><option>Cloud solution</option><option>Dedicated team</option></select></label><label><span>Tell us about your project</span><textarea name="message" placeholder="A quick overview of your goals, timeline, and where you need help…" rows={4} required /></label>{state.message && <p className="contact-form-error" role="alert">{state.message}</p>}{state.errors && <p className="contact-form-error" role="alert">{Object.values(state.errors).flat()[0]}</p>}<button className="button button-mint form-submit" type="submit" disabled={pending}>{pending ? "Sending…" : <>Send enquiry <ArrowIcon /></>}</button><small>By submitting, you agree to be contacted about your enquiry.</small></form>;
}
