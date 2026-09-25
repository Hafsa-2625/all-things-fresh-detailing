import type { Dictionary } from "@/i18n/dictionary";
import { TOTAL_STEPS } from "@/lib/booking/configurator-state";

const STEP_KEYS = ["service", "vehicle", "addons", "details", "dateTime", "details", "confirm"] as const;

export function ProgressIndicator({ step, dict }: { step: number; dict: Dictionary }) {
  const labels = [
    dict.bookingStrip.steps.service,
    dict.bookingStrip.steps.vehicle,
    dict.bookingStrip.steps.addons,
    dict.configurator.details.heading,
    dict.bookingStrip.steps.dateTime,
    dict.configurator.contact.heading,
    dict.configurator.review.heading,
  ];

  return (
    <div className="mb-6">
      <div className="mb-2.5 flex items-center justify-between text-caption font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
        <span>{dict.configurator.stepOf.replace("{current}", String(step)).replace("{total}", String(TOTAL_STEPS))}</span>
        <span aria-hidden="true">{labels[step - 1]}</span>
      </div>
      <div className="flex gap-1.5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-label={dict.configurator.title}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={STEP_KEYS[i] + i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-[var(--color-ink)]" : "bg-[var(--color-border)]"}`}
          />
        ))}
      </div>
    </div>
  );
}
