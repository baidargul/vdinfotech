"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";

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

type Service = { icon: "code" | "mobile" | "design" | "cloud" | "team"; number: string; title: string; text: string };
function ServiceIcon({ name }: { name: Service["icon"] }) {
  const iconPaths = {
    code: <><path d="m8.5 9-3 3 3 3M15.5 9l3 3-3 3M13 6l-2 12" /></>,
    mobile: <><rect width="11" height="18" x="6.5" y="3" rx="2" /><path d="M10 6h4M11 18h2" /></>,
    design: <><path d="M12 3a9 9 0 1 0 0 18h1.3a2.2 2.2 0 0 0 0-4.4h-1.2a1.8 1.8 0 0 1 0-3.6H15a6 6 0 0 0 0-12Z" /><circle cx="8" cy="9" r=".7" /><circle cx="11" cy="6" r=".7" /></>,
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
  const [submitted, setSubmitted] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (event.currentTarget.reportValidity()) setSubmitted(true); };
  if (submitted) return <div className="form-success" role="status"><span>✓</span><h3>Thank you. We&apos;re on it.</h3><p>Your message is ready for our team. In this frontend demo, no data has been sent.</p><button type="button" onClick={() => setSubmitted(false)}>Send another message</button></div>;
  return <form className="contact-form" onSubmit={submit}><div className="form-row"><label><span>Your name</span><input name="name" type="text" placeholder="Jane Smith" required /></label><label><span>Work email</span><input name="email" type="email" placeholder="jane@company.com" required /></label></div><label><span>What can we help with?</span><select name="service" defaultValue="" required><option value="" disabled>Select a service</option><option>Web development</option><option>Mobile application</option><option>UI/UX design</option><option>Cloud solution</option><option>Dedicated team</option></select></label><label><span>Tell us about your project</span><textarea name="message" placeholder="A quick overview of your goals, timeline, and where you need help…" rows={4} required /></label><button className="button button-mint form-submit" type="submit">Send enquiry <ArrowIcon /></button><small>By submitting, you agree to be contacted about your enquiry.</small></form>;
}
