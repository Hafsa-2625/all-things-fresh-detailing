import type { TenantConfig } from "@/tenant/schema";
import { track } from "@/lib/analytics/track";
import type { AnalyticsEventPayload } from "@/lib/analytics/events";

export type BookingEvent = "booking_start" | "booking_step" | "booking_complete" | "booking_error";

/**
 * Normalized booking interface. UI components call `provider.start()` and
 * never branch on which real booking system is behind it — that logic lives
 * entirely in the adapter. Adding a new provider means adding a new file in
 * `providers/`, not touching any component.
 */
export interface BookingProvider {
  readonly kind: TenantConfig["booking"]["provider"];
  /** Invoked when the visitor clicks any "Book Now" CTA. */
  start(context: { serviceId?: string }): void;
  /** Whether this provider is fully configured and ready to accept bookings. */
  isConfigured(): boolean;
}

export function trackBookingEvent(event: BookingEvent, detail?: AnalyticsEventPayload) {
  track(event, detail);
}
