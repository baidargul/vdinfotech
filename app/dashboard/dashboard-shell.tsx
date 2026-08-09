"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AuthenticatedUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { LogoutButton } from "./logout-button";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/dashboard/posts", label: "Posts", icon: "posts" },
  { href: "/dashboard/posts/trash", label: "Trash", icon: "trash" },
  { href: "/dashboard/profile", label: "Profile", icon: "profile" },
];

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    posts: <><path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14"/><path d="M10 11v6M14 11v6"/></>,
    profile: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function DashboardShell({ user, children }: { user: AuthenticatedUser; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-shell dashboard-header-inner">
          <Link className="brand" href="/" aria-label="VD Infotech home">
            <span className="brand-mark">VD</span>
            <span><strong>VD INFOTECH</strong><small>Creator workspace</small></span>
          </Link>
          <div className="dashboard-header-actions">
            <Link className="dashboard-view-blog" href="/blog" target="_blank">View blog ↗</Link>
            <span className="dashboard-user-mark" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
            <div><strong>{user.name}</strong><small>{user.email}</small></div>
            <form action={logoutAction}><LogoutButton /></form>
          </div>
        </div>
      </header>

      <div className="dashboard-shell dashboard-body">
        <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
          <nav>
            {navigation.map((item) => {
              const active = item.href === "/dashboard"
                ? pathname === item.href
                : pathname === item.href || (item.href === "/dashboard/posts" && pathname.startsWith("/dashboard/posts/") && !pathname.endsWith("/trash"));
              return <Link className={active ? "is-active" : ""} href={item.href} key={item.href}><NavIcon name={item.icon} />{item.label}</Link>;
            })}
          </nav>
          <div className="dashboard-help">
            <span>Creator tip</span>
            <p>Save early, preview your work, and schedule posts when your readers are most active.</p>
            <Link href="/blog">Explore the blog →</Link>
          </div>
        </aside>
        {children}
      </div>
    </main>
  );
}
