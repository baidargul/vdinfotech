"use client";

import { useActionState, useState } from "react";
import { saveWhatsAppSettingsAction, type WhatsAppSettingsState } from "@/app/actions/settings";
import type { WhatsAppSettingsData } from "@/lib/whatsapp-settings";

export function WhatsAppSettingsForm({ initialSettings }: { initialSettings: WhatsAppSettingsData }) {
  const initialState: WhatsAppSettingsState = { values: initialSettings };
  const [state, formAction, pending] = useActionState(saveWhatsAppSettingsAction, initialState);
  const values = state.values ?? initialSettings;
  const [enabled, setEnabled] = useState(values.enabled);

  return (
    <form className="settings-form widget-config-form" action={formAction}>
      {state.message && <p className={state.success ? "editor-notice is-success" : "editor-notice"} role="status" aria-live="polite">{state.message}</p>}

      <label className="settings-toggle">
        <span><strong>Enable WhatsApp button</strong><small>Show the floating contact button on the public website and blog.</small></span>
        <input type="checkbox" name="enabled" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
        <i aria-hidden="true" />
      </label>

      <label className="editor-field">
        <span>Indian WhatsApp number</span>
        <span className="indian-phone-input"><b>+91</b><input name="phoneNumber" type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[6-9][0-9]{9}" minLength={10} maxLength={10} defaultValue={values.phoneNumber} placeholder="9876543210" required={enabled} aria-describedby="whatsapp-number-help" /></span>
        <small id="whatsapp-number-help">Enter a 10-digit Indian mobile number starting with 6, 7, 8, or 9.</small>
        {state.errors?.phoneNumber?.map((error) => <p className="editor-error" key={error}>{error}</p>)}
      </label>

      <label className="editor-field">
        <span>Custom pre-filled message</span>
        <textarea name="customMessage" rows={5} maxLength={500} defaultValue={values.customMessage} placeholder="Hello VD Infotech, I would like to discuss a project." required={enabled} />
        <small>This message will be ready in the visitor&apos;s WhatsApp chat. Maximum 500 characters.</small>
        {state.errors?.customMessage?.map((error) => <p className="editor-error" key={error}>{error}</p>)}
      </label>

      <div className="settings-form-actions">
        <span>{enabled ? "The button will be visible after saving." : "The button is currently disabled."}</span>
        <button className="editor-submit editor-publish" type="submit" disabled={pending}>{pending ? "Saving…" : "Save WhatsApp widget"}</button>
      </div>
    </form>
  );
}
