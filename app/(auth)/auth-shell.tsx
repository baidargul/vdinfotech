import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <div className="auth-visual" aria-hidden="true">
        <div className="auth-grid" />
        <div className="auth-orbit auth-orbit-one"><span>VD</span></div>
        <div className="auth-orbit auth-orbit-two"><span>01</span></div>
        <div className="auth-message">
          <small>Ideas. Engineered.</small>
          <strong>Build with confidence.</strong>
          <p>Secure access to your VD Infotech workspace.</p>
        </div>
      </div>

      <section className="auth-panel">
        <Link className="brand auth-brand" href="/" aria-label="VD Infotech home">
          <span className="brand-mark">VD</span>
          <span><strong>VD INFOTECH</strong><small>Ideas. Engineered.</small></span>
        </Link>
        <div className="auth-card">
          <p className="eyebrow"><span /> {eyebrow}</p>
          <h1>{title}</h1>
          <p className="auth-description">{description}</p>
          {children}
        </div>
        <p className="auth-back"><Link href="/">← Back to website</Link></p>
      </section>
    </main>
  );
}
