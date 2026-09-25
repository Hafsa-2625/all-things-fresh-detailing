import type { Dictionary } from "@/i18n/dictionary";

export function StepDetails({
  dict,
  vehicleDescription,
  notes,
  onChange,
}: {
  dict: Dictionary;
  vehicleDescription: string;
  notes: string;
  onChange: (field: "vehicleDescription" | "notes", value: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-5 text-title font-bold">{dict.configurator.details.heading}</h3>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-small font-medium text-[var(--color-ink-muted)]">{dict.configurator.details.vehicleLabel}</span>
          <input
            type="text"
            required
            value={vehicleDescription}
            onChange={(e) => onChange("vehicleDescription", e.target.value)}
            placeholder={dict.configurator.details.vehiclePlaceholder}
            className="h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 text-body outline-none focus-visible:border-[var(--color-focus)]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-small font-medium text-[var(--color-ink-muted)]">{dict.configurator.details.notesLabel}</span>
          <textarea
            value={notes}
            onChange={(e) => onChange("notes", e.target.value)}
            placeholder={dict.configurator.details.notesPlaceholder}
            rows={3}
            className="resize-none rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-body outline-none focus-visible:border-[var(--color-focus)]"
          />
        </label>
      </div>
    </div>
  );
}
