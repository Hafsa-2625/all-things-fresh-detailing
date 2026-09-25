import type { TenantConfig } from "@/tenant/schema";
import type { Dictionary } from "@/i18n/dictionary";

export function StepAddOns({
  tenant,
  dict,
  primaryServiceId,
  selected,
  onToggle,
}: {
  tenant: TenantConfig;
  dict: Dictionary;
  primaryServiceId: string | null;
  selected: string[];
  onToggle: (serviceId: string) => void;
}) {
  const candidates = tenant.services.filter((s) => s.id !== primaryServiceId);

  return (
    <div>
      <h3 className="mb-1.5 text-title font-bold">{dict.configurator.addOns.heading}</h3>
      <p className="mb-5 text-small text-[var(--color-ink-muted)]">{dict.configurator.addOns.helper}</p>
      <div className="flex flex-col gap-2">
        {candidates.map((service) => {
          const checked = selected.includes(service.id);
          return (
            <label
              key={service.id}
              className={`flex cursor-pointer items-center justify-between rounded-[var(--radius-control)] border px-4 py-3 transition-colors ${
                checked ? "border-[var(--color-ink)] bg-[var(--color-contrast-raised)]" : "border-[var(--color-border)] hover:bg-[var(--color-contrast-raised)]"
              }`}
            >
              <span className="text-small font-medium">{service.name}</span>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(service.id)}
                className="h-4 w-4 accent-[var(--color-ink)]"
              />
            </label>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="mt-3 text-caption text-[var(--color-ink-faint)]">{dict.configurator.addOns.noneSelected}</p>
      )}
    </div>
  );
}
