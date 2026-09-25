import type { TenantConfig } from "@/tenant/schema";
import type { BookingProvider } from "../types";

/**
 * AWAITING CREDENTIALS. Posts booking/lead payloads to a client-configured
 * webhook (Zapier, Make, n8n, a CRM). The endpoint is a Next.js Route Handler
 * (server-side) so the destination URL and any signing secret stay out of
 * the client bundle — see docs/architecture.md#booking. Nothing calls this
 * provider yet because no tenant has `booking.provider: "webhook"` configured;
 * it exists so the adapter surface is complete and ready to enable per-client.
 */
export function createWebhookProvider(tenant: TenantConfig): BookingProvider {
  return {
    kind: "webhook",
    isConfigured: () => Boolean(tenant.booking.webhookUrl),
    start({ serviceId }) {
      if (!tenant.booking.webhookUrl) return;
      void fetch("/api/booking/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.tenantId, serviceId }),
      });
    },
  };
}
