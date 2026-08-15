import { requireUser } from "@/lib/auth";

export default async function HeroStudioLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <main className="hero-studio-page">
    <header className="hero-studio-header"><span /><div><span className="brand-mark">VD</span><strong>HERO STUDIO</strong></div><span>{user.name}</span></header>
    {children}
  </main>;
}
