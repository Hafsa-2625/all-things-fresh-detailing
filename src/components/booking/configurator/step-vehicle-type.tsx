import type { Dictionary } from "@/i18n/dictionary";
import type { VehicleType } from "@/lib/booking/configurator-state";

const TYPES: VehicleType[] = ["sedan", "suv", "truck", "van", "luxury", "boat"];

const ICONS: Record<VehicleType, string> = {
  sedan: "M3 12l1.5-5A2 2 0 0 1 6.4 5.5h11.2A2 2 0 0 1 19.5 7L21 12v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z M6 15.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18 15.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  suv: "M2 12l1-5a2 2 0 0 1 2-1.5h14A2 2 0 0 1 21 7l1 5v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H5v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z M6 16a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18 16a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  truck: "M2 8h11v9H2zM13 11h4l4 3v3h-8z M6 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  van: "M2 8a1 1 0 0 1 1-1h14l4 4v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H5v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z M6 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  luxury: "M3 13l1.5-4.5A2.5 2.5 0 0 1 6.9 7h10.2a2.5 2.5 0 0 1 2.4 1.7L21 13v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM12 3v4",
  boat: "M4 14h16l-2 5H6zM12 3v9M7 8l5-2 5 2",
};

export function StepVehicleType({
  dict,
  selected,
  onSelect,
}: {
  dict: Dictionary;
  selected: VehicleType | null;
  onSelect: (type: VehicleType) => void;
}) {
  return (
    <div>
      <h3 className="mb-5 text-title font-bold">{dict.configurator.vehicleType.heading}</h3>
      <div role="radiogroup" aria-label={dict.configurator.vehicleType.heading} className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={selected === type}
            onClick={() => onSelect(type)}
            className={`flex flex-col items-center gap-2.5 rounded-[var(--radius-control)] border px-3 py-5 transition-colors ${
              selected === type
                ? "border-[var(--color-ink)] bg-[var(--color-contrast-raised)]"
                : "border-[var(--color-border)] hover:bg-[var(--color-contrast-raised)]"
            }`}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <path d={ICONS[type]} />
            </svg>
            <span className="text-small font-medium">{dict.configurator.vehicleType[type]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
