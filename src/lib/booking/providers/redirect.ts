import type { TenantConfig } from "@/tenant/schema";
import type { BookingProvider } from "../types";
import { trackBookingEvent } from "../types";

/**
 * Sends the visitor to a third-party booking system (Fieldd, Jobber, Square,
 * Calendly, ...) in a new tab. This is the fastest adapter to stand up for a
 * new client. Most detailers already have a live booking link, and the
 * provider abstraction keeps that destination replaceable without changing
 * the public design components.
 */
export function createRedirectProvider(tenant: TenantConfig): BookingProvider {
  return {
    kind: tenant.booking.provider,
    isConfigured: () => Boolean(tenant.booking.publicUrl),
    start({ serviceId }) {
      if (!tenant.booking.publicUrl) return;
      trackBookingEvent("booking_start", { provider: tenant.booking.provider, serviceId });
      window.open(tenant.booking.publicUrl, "_blank", "noopener,noreferrer");
    },
  };
}
