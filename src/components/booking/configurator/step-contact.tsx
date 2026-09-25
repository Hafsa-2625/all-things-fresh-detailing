import type { Dictionary } from "@/i18n/dictionary";
import type { ContactMethod } from "@/lib/booking/configurator-state";

const METHODS: ContactMethod[] = ["phone", "text", "email"];

export function StepContact({
  dict,
  name,
  email,
  phone,
  contactMethod,
  onFieldChange,
  onMethodChange,
}: {
  dict: Dictionary;
  name: string;
  email: string;
  phone: string;
  contactMethod: ContactMethod | null;
  onFieldChange: (field: "name" | "email" | "phone", value: string) => void;
  onMethodChange: (method: ContactMethod) => void;
}) {
  const methodLabel: Record<ContactMethod, string> = {
    phone: dict.configurator.contact.contactPhone,
    email: dict.configurator.contact.contactEmail,
    text: dict.configurator.contact.contactText,
  };

  return (
    <div>
      <h3 className="mb-5 text-title font-bold">{dict.configurator.contact.heading}</h3>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-small font-medium text-[var(--color-ink-muted)]">{dict.configurator.contact.nameLabel}</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => onFieldChange("name", e.target.value)}
            className="h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 text-body outline-none focus-visible:border-[var(--color-focus)]"
          />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-small font-medium text-[var(--color-ink-muted)]">{dict.configurator.contact.phoneLabel}</span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => onFieldChange("phone", e.target.value)}
              className="h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 text-body outline-none focus-visible:border-[var(--color-focus)]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-small font-medium text-[var(--color-ink-muted)]">{dict.configurator.contact.emailLabel}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => onFieldChange("email", e.target.value)}
              className="h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 text-body outline-none focus-visible:border-[var(--color-focus)]"
            />
          </label>
        </div>
        <div>
          <span className="mb-1.5 block text-small font-medium text-[var(--color-ink-muted)]">{dict.configurator.contact.contactMethodLabel}</span>
          <div role="radiogroup" aria-label={dict.configurator.contact.contactMethodLabel} className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={contactMethod === m}
                onClick={() => onMethodChange(m)}
                className={`rounded-[var(--radius-control)] border px-3 py-2.5 text-small font-medium transition-colors ${
                  contactMethod === m
                    ? "border-[var(--color-ink)] bg-[var(--color-contrast-raised)]"
                    : "border-[var(--color-border)] hover:bg-[var(--color-contrast-raised)]"
                }`}
              >
                {methodLabel[m]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
