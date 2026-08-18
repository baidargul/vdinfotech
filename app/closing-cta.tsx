"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>;
}

export function ClosingCta() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.1,
          },
        });

        timeline
          .fromTo(".cta-depth-left", { yPercent: -24, rotation: 22, scale: 1.12 }, { yPercent: 22, rotation: 30, scale: 1, ease: "none" }, 0)
          .fromTo(".cta-depth-right", { yPercent: 30, rotation: 23, scale: 1.08 }, { yPercent: -20, rotation: 31, scale: 1, ease: "none" }, 0)
          .fromTo(".cta-lines", { backgroundPositionX: "0px", yPercent: -5 }, { backgroundPositionX: "190px", yPercent: 5, ease: "none" }, 0)
          .fromTo(".cta-content .eyebrow", { y: 22 }, { y: -14, ease: "none" }, 0)
          .fromTo(".cta-content h2", { y: 48, scale: .975 }, { y: -20, scale: 1.015, ease: "none" }, 0)
          .fromTo(".cta-content .button", { y: 72 }, { y: -8, ease: "none" }, 0);
      }, root);

      return () => context.revert();
    });

    return () => media.revert();
  }, []);

  return <section className="closing-cta" ref={root}>
    <span className="cta-depth-plane cta-depth-left" aria-hidden="true" />
    <span className="cta-depth-plane cta-depth-right" aria-hidden="true" />
    <div className="cta-lines" aria-hidden="true" />
    <div className="shell cta-content">
      <p className="eyebrow light"><span /> Your next chapter</p>
      <h2>Let&apos;s build something<br /><em>worth remembering.</em></h2>
      <a className="button button-mint" href="#contact">Start a conversation <ArrowIcon /></a>
    </div>
  </section>;
}
