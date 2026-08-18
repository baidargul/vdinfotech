"use client";

import { useActionState, useState } from "react";
import { saveContactWidgetSettingsAction, type ContactWidgetSettingsState } from "@/app/actions/settings";
import type { ContactWidgetSettingsData } from "@/lib/contact-widget-settings";

export function ContactWidgetSettingsForm({ initialSettings }: { initialSettings: ContactWidgetSettingsData }) {
  const initialState: ContactWidgetSettingsState = { values: initialSettings };
  const [state, formAction, pending] = useActionState(saveContactWidgetSettingsAction, initialState);
  const values = state.values ?? initialSettings;
  const [enabled, setEnabled] = useState(values.enabled);

  return <form className="settings-form widget-config-form" action={formAction}>
    {state.message && <p className={state.success ? "editor-notice is-success" : "editor-notice"} role="status" aria-live="polite">{state.message}</p>}
    <label className="settings-toggle">
      <span><strong>Enable contact widget</strong><small>Show the floating enquiry panel on the website and blog.</small></span>
      <input type="checkbox" name="enabled" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
    <div className="widget-copy-grid">
      <label className="editor-field"><span>Intro label</span><input name="kicker" defaultValue={values.kicker} maxLength={80} required />{state.errors?.kicker?.map((error) => <p className="editor-error" key={error}>{error}</p>)}</label>
      <label className="editor-field"><span>Heading</span><input name="heading" defaultValue={values.heading} maxLength={80} required />{state.errors?.heading?.map((error) => <p className="editor-error" key={error}>{error}</p>)}</label>
    </div>
    <label className="editor-field"><span>Description</span><textarea name="description" defaultValue={values.description} rows={3} maxLength={240} required />{state.errors?.description?.map((error) => <p className="editor-error" key={error}>{error}</p>)}</label>
    <label className="editor-field"><span>Submit button label</span><input name="buttonLabel" defaultValue={values.buttonLabel} maxLength={60} required />{state.errors?.buttonLabel?.map((error) => <p className="editor-error" key={error}>{error}</p>)}</label>
    <div className="settings-form-actions"><span>{enabled ? "The contact widget will be visible after saving." : "The contact widget is disabled."}</span><button className="editor-submit editor-publish" type="submit" disabled={pending}>{pending ? "Saving…" : "Save contact widget"}</button></div>
  </form>;
}
