import type { Metadata } from "next";
import Link from "next/link";
import { getContactWidgetSettings } from "@/lib/contact-widget-settings";
import { getReviewSettings } from "@/lib/review-settings";
import { getWhatsAppSettings } from "@/lib/whatsapp-settings";
import { ContactWidgetSettingsForm } from "./contact-widget-settings-form";
import { ReviewsSettingsForm } from "./reviews-settings-form";
import { WhatsAppSettingsForm } from "./whatsapp-settings-form";

export const metadata: Metadata = { title: "Website Settings | VD Infotech" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const activeTab = tab === "reviews" ? "reviews" : "widgets";
  const reviewSettings = activeTab === "reviews" ? await getReviewSettings() : null;
  const widgetSettings = activeTab === "widgets" ? await Promise.all([getContactWidgetSettings(), getWhatsAppSettings()]) : null;
  return (
    <section className="dashboard-content settings-page">
      <div className="manager-heading"><div><p className="eyebrow"><span /> Website controls</p><h1>Settings</h1><p>Manage contact channels and public website behaviour.</p></div></div>
      <nav className="settings-tabs" aria-label="Website settings">
        <Link className={activeTab === "widgets" ? "is-active" : ""} aria-current={activeTab === "widgets" ? "page" : undefined} href="/dashboard/settings?tab=widgets">Widgets</Link>
        <Link className={activeTab === "reviews" ? "is-active" : ""} aria-current={activeTab === "reviews" ? "page" : undefined} href="/dashboard/settings?tab=reviews">Reviews</Link>
      </nav>
      <div className="dashboard-card settings-panel">
        {activeTab === "reviews" ? <>
          <div className="settings-panel-heading"><span className="settings-reviews-icon" aria-hidden="true">“</span><div><h2>Reviews carousel</h2><p>Manage client stories, photos, playback timing, and transitions shown on the website.</p></div></div>
          <ReviewsSettingsForm initialSettings={reviewSettings!} />
        </> : <>
          <div className="settings-panel-heading"><span className="settings-widgets-icon" aria-hidden="true">••</span><div><h2>Floating widgets</h2><p>Control the contact and WhatsApp widgets shown across the public website.</p></div></div>
          <section className="widget-settings-section">
            <div className="widget-settings-heading"><span className="settings-contact-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.3-4.6A7 7 0 0 1 3 13V8a5 5 0 0 1 5-5h9a4 4 0 0 1 4 4Z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg></span><div><h3>Contact widget</h3><p>Collect visitor details as leads and customise the enquiry panel copy.</p></div></div>
            <ContactWidgetSettingsForm initialSettings={widgetSettings![0]} />
          </section>
          <section className="widget-settings-section">
            <div className="widget-settings-heading"><span className="settings-whatsapp-icon" aria-hidden="true">WA</span><div><h3>WhatsApp widget</h3><p>Connect visitors to an Indian WhatsApp number with a pre-filled message.</p></div></div>
            <WhatsAppSettingsForm initialSettings={widgetSettings![1]} />
          </section>
        </>}
      </div>
    </section>
  );
}
