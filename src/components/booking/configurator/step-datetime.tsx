import type { Dictionary } from "@/i18n/dictionary";
import type { TimeOfDay } from "@/lib/booking/configurator-state";

const TIMES: TimeOfDay[] = ["morning", "afternoon", "evening"];

export function StepDateTime({
  dict,
  date,
  timeOfDay,
  onDateChange,
  onTimeChange,
}: {
  dict: Dictionary;
  date: string;
  timeOfDay: TimeOfDay | null;
  onDateChange: (value: string) => void;
  onTimeChange: (value: TimeOfDay) => void;
}) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <h3 className="mb-5 text-title font-bold">{dict.configurator.dateTime.heading}</h3>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-small font-medium text-[var(--color-ink-muted)]">{dict.configurator.dateTime.dateLabel}</span>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 text-body outline-none focus-visible:border-[var(--color-focus)]"
          />
        </label>
        <div>
          <span className="mb-1.5 block text-small font-medium text-[var(--color-ink-muted)]">{dict.configurator.dateTime.timeLabel}</span>
          <div role="radiogroup" aria-label={dict.configurator.dateTime.timeLabel} className="grid grid-cols-3 gap-2">
            {TIMES.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={timeOfDay === t}
                onClick={() => onTimeChange(t)}
                className={`rounded-[var(--radius-control)] border px-3 py-2.5 text-small font-medium transition-colors ${
                  timeOfDay === t
                    ? "border-[var(--color-ink)] bg-[var(--color-contrast-raised)]"
                    : "border-[var(--color-border)] hover:bg-[var(--color-contrast-raised)]"
                }`}
              >
                {dict.configurator.dateTime[t]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
