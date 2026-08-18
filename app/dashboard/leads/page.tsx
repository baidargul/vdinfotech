import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Lead } from "@/models/lead";

export const metadata: Metadata = { title: "Leads | VD Infotech" };
const PAGE_SIZE = 12;
const leadStatuses = ["all", "new", "contacted", "qualified", "closed"] as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const requestedStatus = typeof params.status === "string" ? params.status : "all";
  const status = leadStatuses.includes(requestedStatus as (typeof leadStatuses)[number]) ? requestedStatus : "all";
  const requestedPage = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);
  const filter: Record<string, unknown> = {};
  if (query) filter.$or = ["name", "email", "phone", "company", "message"].map((field) => ({ [field]: { $regex: escapeRegex(query), $options: "i" } }));
  if (status !== "all") filter.status = status;

  await connectToDatabase();
  const total = await Lead.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  const leads = await Lead.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean().exec();
  const pageHref = (nextPage: number) => `/dashboard/leads?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(status !== "all" ? { status } : {}), page: String(nextPage) })}`;

  return <section className="dashboard-content dashboard-leads-manager">
    <div className="manager-heading"><div><p className="eyebrow"><span /> Sales inbox</p><h1>Leads</h1><p>Every enquiry from the website, newest first.</p></div><span className="lead-total-badge">{total} lead{total === 1 ? "" : "s"}</span></div>
    <form className="post-filters lead-filters"><input type="search" name="q" defaultValue={query} placeholder="Search name, email, phone or company" /><select name="status" defaultValue={status}>{leadStatuses.map((item) => <option value={item} key={item}>{item === "all" ? "All statuses" : item.charAt(0).toUpperCase() + item.slice(1)}</option>)}</select><button type="submit">Filter</button></form>
    <section className="dashboard-card leads-table-card">
      {leads.length ? <div className="leads-table">
        <div className="leads-table-head"><span>Contact</span><span>Company / phone</span><span>Source</span><span>Received</span></div>
        {leads.map((lead) => <article key={lead._id.toString()}>
          <div className="lead-contact"><span className="lead-initial">{lead.name.charAt(0).toUpperCase()}</span><div><strong>{lead.name}</strong><a href={`mailto:${lead.email}`}>{lead.email}</a>{lead.visitorId && <small title={lead.visitorId}>Returning ID · {lead.visitorId.slice(0, 8)}</small>}</div></div>
          <div className="lead-company"><strong>{lead.company || "—"}</strong>{lead.phone ? <a href={`tel:${lead.phone}`}>{lead.phone}</a> : <span>No phone supplied</span>}</div>
          <div><span className={`lead-status status-${lead.status}`}>{lead.status}</span><small className="lead-source">{lead.source === "chat-widget" ? "Chat widget" : "Contact form"}</small></div>
          <div className="lead-received"><time dateTime={lead.createdAt.toISOString()}>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(lead.createdAt)}</time><small>{new Intl.DateTimeFormat("en", { timeStyle: "short" }).format(lead.createdAt)}</small></div>
          {(lead.service || lead.message) && <details className="lead-details"><summary>View enquiry</summary><div>{lead.service && <span>Interested in: <strong>{lead.service}</strong></span>}{lead.message && <p>{lead.message}</p>}{lead.pageUrl && <a href={lead.pageUrl} target="_blank" rel="noreferrer">Submission page ↗</a>}</div></details>}
        </article>)}
      </div> : <div className="dashboard-empty"><h3>No leads found.</h3><p>{query || status !== "all" ? "Try adjusting your filters." : "Website enquiries will appear here as soon as they arrive."}</p></div>}
    </section>
    {pages > 1 && <nav className="pagination" aria-label="Leads pagination">{page > 1 && <Link href={pageHref(page - 1)}>← Previous</Link>}<span>Page {page} of {pages}</span>{page < pages && <Link href={pageHref(page + 1)}>Next →</Link>}</nav>}
  </section>;
}
