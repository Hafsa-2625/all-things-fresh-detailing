import type { TenantConfig } from "@/tenant/schema";
import type { BookingProvider } from "../types";
import { trackBookingEvent } from "../types";

/**
 * Opens the in-page configurator (see components/booking/configurator/) instead
 * of leaving the site. `openModal` is threaded in from the
 * `ConfiguratorModalProvider` context by `useBookingProvider` — this file
 * stays a plain, framework-agnostic factory like every other provider so it
 * doesn't itself depend on React context.
 */
export function createInternalProvider(tenant: TenantConfig, openModal: (serviceId?: string) => void): BookingProvider {
  return {
    kind: "internal",
    isConfigured: () => true, // the configurator UI always works; whether submissions reach a
    // real destination depends on booking.webhookUrl, which the configurator itself
    // messages honestly (preview banner) rather than gating the button on.
    start({ serviceId }) {
      trackBookingEvent("booking_start", { provider: "internal", serviceId, tenantId: tenant.tenantId });
      openModal(serviceId);
    },
  };
}
