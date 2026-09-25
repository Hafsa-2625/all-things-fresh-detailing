"use client";

import { useEffect, useRef } from "react";
import type { TenantConfig } from "@/tenant/schema";
import type { Dictionary } from "@/i18n/dictionary";
import { useConfiguratorModal } from "./configurator-context";
import { BookingConfigurator } from "./booking-configurator";

/** Mounted once in the root layout; opens via useConfiguratorModal().open()
 * from anywhere (the "inline" booking provider calls this — see
 * lib/booking/providers/internal.ts). Renders nothing when closed. */
export function ConfiguratorModal({ tenant, dict }: { tenant: TenantConfig; dict: Dictionary }) {
  const { isOpen, serviceId, close } = useConfiguratorModal();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/50" onClick={close} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={dict.configurator.title}
        tabIndex={-1}
        className="relative max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-[var(--radius-card)] bg-[var(--color-canvas)] p-6 shadow-2xl outline-none sm:rounded-[var(--radius-card)] sm:p-7"
      >
        <BookingConfigurator tenant={tenant} dict={dict} initialServiceId={serviceId} onClose={close} />
      </div>
    </div>
  );
}
