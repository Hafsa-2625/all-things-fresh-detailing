"use client";

import type { TenantConfig } from "@/tenant/schema";
import type { BookingProvider } from "./types";
import { useConfiguratorModal } from "@/components/booking/configurator/configurator-context";
import { createRedirectProvider } from "./providers/redirect";
import { createWebhookProvider } from "./providers/webhook";
import { createInternalProvider } from "./providers/internal";

/**
 * Client-side counterpart to getTenant()-style server logic: resolves which
 * BookingProvider a "Book Now" click should use, based on `booking.mode`.
 * A hook (not a plain function) only because the "inline"/"modal" case needs
 * the ConfiguratorModalProvider context to open the shared modal instance —
 * every other provider is the same plain factory used elsewhere.
 */
export function useBookingProvider(tenant: TenantConfig): BookingProvider {
  const { open } = useConfiguratorModal();

  switch (tenant.booking.mode) {
    case "inline":
    case "modal":
      return createInternalProvider(tenant, open);
    case "redirect":
      return createRedirectProvider(tenant);
    case "api":
      return createWebhookProvider(tenant);
    default:
      return tenant.booking.publicUrl ? createRedirectProvider(tenant) : createInternalProvider(tenant, open);
  }
}
