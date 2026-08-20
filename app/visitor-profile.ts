"use client";

import { useMemo, useSyncExternalStore } from "react";
import { createClientId } from "@/lib/client-id";

const STORAGE_KEY = "vdinfotech.visitor";
const PROFILE_EVENT = "vdinfotech:visitor-profile";

export type VisitorProfile = {
  visitorId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
};

const emptyProfile: VisitorProfile = { visitorId: "", name: "", email: "", phone: "", company: "" };

function snapshot() {
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY) callback(); };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(PROFILE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(PROFILE_EVENT, callback);
  };
}

export function useVisitorProfile(): VisitorProfile {
  const stored = useSyncExternalStore(subscribe, snapshot, () => "");
  return useMemo(() => {
    if (!stored) return emptyProfile;
    try { return { ...emptyProfile, ...JSON.parse(stored) } as VisitorProfile; } catch { return emptyProfile; }
  }, [stored]);
}

export function saveVisitorProfile(profile: Omit<VisitorProfile, "visitorId"> & { visitorId?: string }) {
  let current = emptyProfile;
  try { current = { ...emptyProfile, ...JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") }; } catch { /* Ignore invalid legacy data. */ }
  const next: VisitorProfile = {
    visitorId: profile.visitorId || current.visitorId || createClientId(),
    name: profile.name || current.name,
    email: profile.email || current.email,
    phone: profile.phone || current.phone,
    company: profile.company || current.company,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(PROFILE_EVENT));
  return next;
}
