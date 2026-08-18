import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ContactForm,
  FaqList,
  SiteHeader,
  ServiceRail,
} from "./interactive";
import { LatestPosts } from "./latest-posts";
import { HeroCarousel } from "./hero-carousel";
import { ReviewsCarousel } from "./reviews-carousel";
import { getHeroSettings } from "@/lib/hero-data";
import { getReviewSettings } from "@/lib/review-settings";

export const dynamic = "force-dynamic";

type IconName =
  | "code"
  | "mobile"
  | "ai"
  | "cloud"
  | "team"
  | "arrow"
  | "check"
  | "spark"
  | "mail"
  | "phone"
  | "pin";

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    code: <><path d="m8.5 9-3 3 3 3"/><path d="m15.5 9 3 3-3 3"/><path d="m13 6-2 12"/></>,
    mobile: <><rect width="11" height="18" x="6.5" y="3" rx="2"/><path d="M10 6h4M11 18h2"/></>,
    ai: <><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/><path d="m10 13 1.4-3 1.4 3M10.5 12h1.8M14.5 10v3"/></>,
    cloud: <path d="M17.5 19H7a5 5 0 1 1 1.1-9.9A6.5 6.5 0 0 1 20.4 11 4 4 0 0 1 17.5 19Z"/>,
    team: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    spark: <><path d="m12 3-1.3 4.2a5 5 0 0 1-3.4 3.4L3 12l4.3 1.4a5 5 0 0 1 3.4 3.4L12 21l1.3-4.2a5 5 0 0 1 3.4-3.4L21 12l-4.3-1.4a5 5 0 0 1-3.4-3.4Z"/></>,
    mail: <><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 6L2 7"/></>,
    phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92Z"/>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  };

  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const services = [
  { icon: "code" as const, number: "01", title: "Web Development", text: "Fast, scalable web platforms designed around real business goals and seamless customer journeys.", image: "/services/web-development.png", imageAlt: "Real web engineering workspace with interface layouts and code" },
  { icon: "mobile" as const, number: "02", title: "Mobile Apps", text: "Intuitive iOS and Android products that feel native, perform reliably, and keep users coming back.", image: "/services/mobile-apps.png", imageAlt: "Mobile product prototypes and interaction sketches on a workbench" },
  { icon: "ai" as const, number: "03", title: "AI Integrations", text: "Practical AI solutions that automate workflows, connect your data, and help your team make faster decisions.", image: "/services/ai-integrations.png", imageAlt: "Applied AI workstation with data pipeline and evaluation dashboard" },
  { icon: "cloud" as const, number: "04", title: "Cloud Solutions", text: "Secure infrastructure and smart integrations built to scale with your team and your customers.", image: "/services/cloud-solutions.png", imageAlt: "Private cloud infrastructure with server racks and structured cabling" },
  { icon: "team" as const, number: "05", title: "Dedicated Teams", text: "A focused, senior delivery team that fits your process and helps you move from idea to impact.", image: "/services/dedicated-teams.png", imageAlt: "Experienced delivery team reviewing a shared product roadmap" },
];

const projects = [
  { type: "Fintech platform", title: "Orbit Finance", result: "2.4× faster onboarding", image: "/projects/orbit-finance-dashboard.png", imageAlt: "Orbit Finance cash operations dashboard" },
  { type: "Health technology", title: "CareSync", result: "60% fewer admin tasks", image: "/projects/caresync-dashboard.png", imageAlt: "CareSync clinic scheduling and patient operations dashboard" },
  { type: "Commerce ecosystem", title: "Northstar", result: "+38% conversion", image: "/projects/northstar-dashboard.png", imageAlt: "Northstar commerce analytics and inventory dashboard" },
];

const faqs = [
  { question: "What kind of companies do you work with?", answer: "We partner with ambitious startups, growing SMEs, and established teams that need a reliable product and engineering partner. Engagements can start with a focused MVP or a complete platform rebuild." },
  { question: "How long does a typical project take?", answer: "A focused website usually takes 4–8 weeks, while larger web or mobile products commonly run 10–20 weeks. After discovery, we provide a clear delivery plan with milestones and review points." },
  { question: "Can you improve an existing product?", answer: "Yes. We can audit your existing workflows and codebase, identify high-impact AI opportunities, and deliver them in manageable phases without disrupting your current users." },
  { question: "How do communication and updates work?", answer: "You get a dedicated point of contact, weekly progress reviews, shared project visibility, and direct access to the specialists working on your product." },
  { question: "Do you provide support after launch?", answer: "Yes. We offer flexible maintenance and growth plans covering monitoring, updates, performance, new features, and ongoing product improvement." },
];

export default async function Home() {
  const [heroSettings, reviewSettings] = await Promise.all([getHeroSettings(), getReviewSettings()]);
  return (
    <main>
      <SiteHeader />
      <HeroCarousel settings={heroSettings} />

      <section className="trust-strip" aria-label="Technology expertise">
        <div className="shell trust-row">
          <p>Technologies we trust</p>
          <div className="tech-list"><span>React</span><span>Next.js</span><span>Node.js</span><span>Python</span><span>AWS</span><span>Flutter</span></div>
        </div>
      </section>

      <section className="section intro" id="about">
        <div className="shell intro-grid">
          <div className="section-heading intro-title">
            <p className="eyebrow"><span /> Built for what comes next</p>
            <h2>Technology should move your business <em>forward.</em></h2>
          </div>
          <div className="intro-copy">
            <p>Great software is more than clean code. It is a deep understanding of people, a clear commercial goal, and dozens of thoughtful decisions working together.</p>
            <p>We bring strategy, design, and engineering under one roof—giving you one committed team from first sketch to successful launch.</p>
            <a className="text-link" href="#process">How we work <Icon name="arrow" /></a>
          </div>
          <div className="metric-art" aria-hidden="true">
            <div className="pill-shape pill-one" /><div className="pill-shape pill-two" />
            <div className="metric-badge"><strong>08+</strong><span>Years crafting<br />digital products</span></div>
          </div>
        </div>
      </section>

      <section className="section services-section" id="services">
        <div className="shell service-wrap">
          <div className="service-heading">
            <div><p className="eyebrow light"><span /> What we do</p><h2>Expertise that takes you from <em>idea to impact.</em></h2></div>
            <p>One senior, cross-functional team for every part of your digital journey.</p>
          </div>
          <ServiceRail services={services} />
        </div>
      </section>

      <section className="section work-section" id="work">
        <div className="shell">
          <div className="section-heading centered">
            <p className="eyebrow"><span /> Selected work</p>
            <h2>Products that perform in the <em>real world.</em></h2>
          </div>
          <div className="project-grid">
            {projects.map((project, index) => (
              <article className="project-card" key={project.title}>
                <div className="project-mockup">
                  <Image src={project.image} alt={project.imageAlt} fill sizes="(max-width: 760px) calc(100vw - 56px), (max-width: 1000px) 30vw, 360px" />
                </div>
                <div className="project-info"><span>{project.type}</span><h3>{project.title}</h3><p>{project.result}</p><a href="#contact" aria-label={`Discuss a project like ${project.title}`}><Icon name="arrow" /></a></div>
                <span className="project-number">0{index + 1}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ReviewsCarousel settings={reviewSettings} />

      <section className="section metrics-section">
        <div className="shell">
          <div className="section-heading centered metrics-heading">
            <p className="eyebrow"><span /> Measurable momentum</p>
            <h2>Built to create value you can <em>see.</em></h2>
          </div>
          <div className="metrics-mosaic">
            <article className="metric-tile metric-visual-a metric-visual-image"><Image src="/metrics/product-delivery-dashboard.png" alt="Software delivery control center showing releases, milestones, deployments, and team workload" fill sizes="(max-width: 480px) calc(100vw - 32px), (max-width: 760px) 48vw, 390px" /></article>
            <article className="metric-tile metric-copy-tile">
              <div className="metric-weather" aria-hidden="true">
                <span className="weather-cloud weather-cloud-one" />
                <span className="weather-cloud weather-cloud-two" />
                <span className="weather-rain"><i /><i /><i /><i /><i /><i /><i /></span>
              </div>
              <Icon name="spark" /><strong>120+</strong><span>products and platforms delivered</span>
            </article>
            <article className="metric-tile metric-visual-b metric-visual-image"><Image src="/metrics/product-performance-dashboard.png" alt="Product performance dashboard showing activation, retention, conversion, and experiments" fill sizes="(max-width: 480px) calc(100vw - 32px), (max-width: 760px) 48vw, 360px" /></article>
            <article className="metric-tile metric-small"><span className="mini-label">Partnership</span><strong>94%</strong><span>of clients work with us again</span></article>
            <article className="metric-tile metric-accent"><span className="mini-label">Impact</span><strong>32%</strong><span>average lift in key product metrics</span></article>
            <article className="metric-tile metric-wide"><span>React</span><span>TypeScript</span><span>Cloud</span><span>AI</span><p>Modern tools. Proven foundations.</p></article>
          </div>
        </div>
      </section>

      <section className="section process-section" id="process">
        <div className="shell process-grid">
          <div className="process-copy">
            <p className="eyebrow"><span /> Why VD Infotech</p>
            <h2>A delivery partner built around <em>your momentum.</em></h2>
            <p>From first idea to continuous improvement, our process keeps everyone aligned and puts real user value at the center of every sprint.</p>
            <ul>
              {["Senior specialists on every engagement", "Weekly demos and transparent progress", "Flexible scope without losing momentum", "Quality, security, and accessibility built in", "Post-launch support when you need it"].map((item) => <li key={item}><span><Icon name="check" /></span>{item}</li>)}
            </ul>
            <a className="button button-dark" href="#contact">Build with us <Icon name="arrow" /></a>
          </div>
          <div className="process-visual">
            <Image src="/process/delivery-workshop.png" alt="Senior delivery team aligning around a shared project roadmap" fill sizes="(max-width: 760px) calc(100vw - 32px), 50vw" />
          </div>
        </div>
      </section>

      <section className="section faq-contact" id="contact">
        <div className="shell faq-contact-grid">
          <div className="faq-side">
            <p className="eyebrow"><span /> Good questions</p>
            <h2>Before we start, you might be <em>wondering…</em></h2>
            <FaqList items={faqs} />
          </div>
          <div className="contact-card">
            <p className="eyebrow light"><span /> Let&apos;s talk</p>
            <h2>Have a project in mind?</h2>
            <p>Tell us a little about it. We&apos;ll get back to you within one business day.</p>
            <ContactForm />
          </div>
        </div>
      </section>

      <LatestPosts />

      <section className="closing-cta">
        <div className="cta-lines" aria-hidden="true" />
        <div className="shell cta-content"><p className="eyebrow light"><span /> Your next chapter</p><h2>Let&apos;s build something<br /><em>worth remembering.</em></h2><a className="button button-mint" href="#contact">Start a conversation <Icon name="arrow" /></a></div>
      </section>

      <footer className="footer">
        <div className="shell footer-grid">
          <div className="footer-brand"><a className="brand" href="#home" aria-label="VD Infotech home"><span className="brand-mark">VD</span><span><strong>VD INFOTECH</strong><small>Ideas. Engineered.</small></span></a><p>We design and build digital products that make businesses more useful, resilient, and ready for what&apos;s next.</p></div>
          <div className="footer-links"><h3>Explore</h3><a href="#about">About</a><a href="#services">Services</a><a href="#work">Work</a><a href="#process">Process</a><Link href="/blog">Blog</Link></div>
          <div className="footer-links"><h3>Services</h3><a href="#services">Web development</a><a href="#services">Mobile apps</a><a href="#services">AI integrations</a><a href="#services">Cloud solutions</a></div>
          <div className="footer-contact"><h3>Get in touch</h3><a href="mailto:hello@vdinfotech.com"><Icon name="mail" /> hello@vdinfotech.com</a><a href="tel:+923001234567"><Icon name="phone" /> +92 300 123 4567</a><p><Icon name="pin" /> Lahore, Pakistan</p></div>
        </div>
        <div className="shell footer-bottom"><span>© 2026 VD Infotech. All rights reserved.</span><div><a href="#">Privacy</a><a href="#">Terms</a><a href="#home">Back to top ↑</a></div></div>
      </footer>
    </main>
  );
}
