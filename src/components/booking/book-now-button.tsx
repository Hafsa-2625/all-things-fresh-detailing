"use client";

import type { TenantConfig } from "@/tenant/schema";
import { useBookingProvider } from "@/lib/booking/use-booking-provider";
import { track } from "@/lib/analytics/track";
import { buttonClass, ArrowRight, type ButtonVariant, type ButtonSize } from "@/components/ui/button";

export function BookNowButton({
  tenant,
  label,
  serviceId,
  variant = "primary-on-light",
  size = "md",
  className = "",
}: {
  tenant: TenantConfig;
  label: string;
  serviceId?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const provider = useBookingProvider(tenant);

  return (
    <button
      type="button"
      onClick={() => {
        track("book_now_click", { serviceId });
        provider.start({ serviceId });
      }}
      disabled={!provider.isConfigured()}
      className={buttonClass(variant, size, className)}
    >
      {label}
      <ArrowRight />
    </button>
  );
}
