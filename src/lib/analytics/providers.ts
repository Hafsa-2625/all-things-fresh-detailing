import type { AnalyticsEvent, AnalyticsEventPayload } from "./events";

export interface AnalyticsProvider {
  name: string;
  track(event: AnalyticsEvent, payload?: AnalyticsEventPayload): void;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/** READY FOR BACKEND WIRING: pushes to GA4 once `NEXT_PUBLIC_GA4_ID` is set
 * (see .env.example) and the gtag.js script is actually loaded — see
 * AnalyticsScripts. Until then this is a harmless no-op. */
export const ga4Provider: AnalyticsProvider = {
  name: "ga4",
  track(event, payload) {
    if (typeof window === "undefined" || !window.gtag) return;
    window.gtag("event", event, payload);
  },
};

/** READY FOR BACKEND WIRING: same story via GTM's dataLayer. */
export const gtmProvider: AnalyticsProvider = {
  name: "gtm",
  track(event, payload) {
    if (typeof window === "undefined" || !window.dataLayer) return;
    window.dataLayer.push({ event, ...payload });
  },
};

/** Meta Pixel — READY FOR BACKEND WIRING (NEXT_PUBLIC_META_PIXEL_ID). */
export const metaPixelProvider: AnalyticsProvider = {
  name: "meta_pixel",
  track(event, payload) {
    if (typeof window === "undefined" || !window.fbq) return;
    window.fbq("trackCustom", event, payload);
  },
};

/** Always on in development — lets you verify event wiring with zero
 * external services connected, per Section 84's "event test mode." */
export const consoleProvider: AnalyticsProvider = {
  name: "console",
  track(event, payload) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[analytics]", event, payload ?? {});
    }
  },
};
