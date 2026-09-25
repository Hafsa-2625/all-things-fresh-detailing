import type { TenantConfig } from "@/tenant/schema";
import type { AnalyticsEvent, AnalyticsEventPayload } from "./events";
import { consoleProvider, ga4Provider, gtmProvider, metaPixelProvider, type AnalyticsProvider } from "./providers";

/** All providers are always registered; each is individually a no-op until
 * its script is actually loaded (see AnalyticsScripts), which only happens
 * when the matching tenantConfig id is set. No branching on "which provider
 * is this tenant using" anywhere else in the app. */
const providers: AnalyticsProvider[] = [consoleProvider, ga4Provider, gtmProvider, metaPixelProvider];

export function track(event: AnalyticsEvent, payload?: AnalyticsEventPayload) {
  for (const provider of providers) provider.track(event, payload);

  // Also broadcast as a DOM CustomEvent so anything that wants to observe
  // conversions without importing this module can (e.g. a future
  // client-side attribution script) — same pattern the booking adapter
  // already used before this module existed.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(`atf:${event}`, { detail: payload }));
  }
}

export function isAnalyticsConfigured(tenant: TenantConfig): boolean {
  return Boolean(tenant.analytics.ga4Id || tenant.analytics.gtmId || tenant.analytics.metaPixelId);
}
