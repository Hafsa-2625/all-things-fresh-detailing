import type { TenantConfig } from "@/tenant/schema";
import type { Dictionary } from "@/i18n/dictionary";

export function StepService({
  tenant,
  dict,
  selected,
  onSelect,
}: {
  tenant: TenantConfig;
  dict: Dictionary;
  selected: string | null;
  onSelect: (serviceId: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-1.5 text-title font-bold">{dict.configurator.service.heading}</h3>
      <p className="mb-5 text-small text-[var(--color-ink-muted)]">{dict.configurator.service.helper}</p>
      <div role="radiogroup" aria-label={dict.configurator.service.heading} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {tenant.services.map((service) => (
          <button
            key={service.id}
            type="button"
            role="radio"
            aria-checked={selected === service.id}
            onClick={() => onSelect(service.id)}
            className={`rounded-[var(--radius-control)] border px-4 py-3.5 text-left transition-colors ${
              selected === service.id
                ? "border-[var(--color-ink)] bg-[var(--color-contrast-raised)]"
                : "border-[var(--color-border)] hover:bg-[var(--color-contrast-raised)]"
            }`}
          >
            <div className="text-body font-semibold">{service.name}</div>
            <div className="mt-1 text-small text-[var(--color-ink-faint)]">{service.blurb}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
