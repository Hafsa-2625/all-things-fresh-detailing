import type { TenantConfig } from "@/tenant/schema";
import type { Dictionary } from "@/i18n/dictionary";
import type { ConfiguratorState } from "@/lib/booking/configurator-state";

function Row({ label, value, onEdit, editLabel }: { label: string; value: string; onEdit: () => void; editLabel: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] py-3 last:border-0">
      <div>
        <div className="text-caption font-semibold uppercase tracking-[0.06em] text-[var(--color-ink-faint)]">{label}</div>
        <div className="mt-1 text-body">{value}</div>
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-small font-semibold text-[var(--color-ink-muted)] underline hover:text-[var(--color-ink)]">
        {editLabel}
      </button>
    </div>
  );
}

export function StepReview({ tenant, dict, state, onEditStep }: { tenant: TenantConfig; dict: Dictionary; state: ConfiguratorState; onEditStep: (step: number) => void }) {
  const service = tenant.services.find((s) => s.id === state.serviceId);
  const addOns = tenant.services.filter((s) => state.addOnIds.includes(s.id));
  const r = dict.configurator.review;

  return (
    <div>
      <h3 className="mb-4 text-title font-bold">{r.heading}</h3>
      <div>
        <Row label={r.service} value={service?.name ?? "—"} onEdit={() => onEditStep(1)} editLabel={dict.configurator.edit} />
        <Row label={r.vehicleType} value={state.vehicleType ? dict.configurator.vehicleType[state.vehicleType] : "—"} onEdit={() => onEditStep(2)} editLabel={dict.configurator.edit} />
        <Row label={r.addOns} value={addOns.length ? addOns.map((a) => a.name).join(", ") : r.none} onEdit={() => onEditStep(3)} editLabel={dict.configurator.edit} />
        <Row label={r.vehicle} value={state.vehicleDescription || "—"} onEdit={() => onEditStep(4)} editLabel={dict.configurator.edit} />
        {state.notes && <Row label={r.notes} value={state.notes} onEdit={() => onEditStep(4)} editLabel={dict.configurator.edit} />}
        <Row
          label={r.dateTime}
          value={state.date && state.timeOfDay ? `${state.date} — ${dict.configurator.dateTime[state.timeOfDay]}` : "—"}
          onEdit={() => onEditStep(5)}
          editLabel={dict.configurator.edit}
        />
        <Row label={r.contact} value={[state.name, state.phone, state.email].filter(Boolean).join(" · ") || "—"} onEdit={() => onEditStep(6)} editLabel={dict.configurator.edit} />
      </div>
    </div>
  );
}
