"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import type { AnalyticsEventType } from "@/lib/cms/analytics";

export interface TrackEventClientPayload {
  eventType: AnalyticsEventType;
  pathname?: string;
  locale?: string;
  projectId?: string;
  projectTitle?: string;
}

export function trackSiteEvent(payload: TrackEventClientPayload): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;

  const deviceHint: "mobile" | "desktop" =
    window.innerWidth < 768 ? "mobile" : "desktop";

  const body = JSON.stringify({
    eventType: payload.eventType,
    pathname: payload.pathname || window.location.pathname || "/",
    locale: payload.locale || "fr",
    referrer: document.referrer || "",
    projectId: payload.projectId || "",
    projectTitle: payload.projectTitle || "",
    deviceHint,
  });

  try {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // ignore network errors silently
    });
  } catch {
    // ignore errors silently
  }
}

export function AnalyticsTracker() {
  const { locale } = useLanguage();
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    trackSiteEvent({
      eventType: "pageview",
      locale,
    });
  }, [locale]);

  return null;
}

