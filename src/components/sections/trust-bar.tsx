import type { TenantConfig } from "@/tenant/schema";
import type { Dictionary } from "@/i18n/dictionary";
import { Section, Container } from "@/components/ui/section";

/**
 * Typographic rather than icon-led. The previous version paired every stat
 * with a small line icon, which read as a generic local-business trust strip;
 * a luxury automotive treatment lets the numerals carry it. Icons removed
 * rather than restyled (Section 24: use icons sparingly).
 */
export function TrustBar({ tenant, dict }: { tenant: TenantConfig; dict: Dictionary }) {
  if (tenant.trustStats.length === 0) return null;

  const label = (id: string) =>
    dict.trust.stats[id as keyof Dictionary["trust"]["stats"]] ?? "";

  return (
    <Section tone="contrast" label="02 Trust bar" rhythm="none" className="border-b border-[var(--color-border)]">
      <Container className="grid grid-cols-2 divide-[var(--color-border)] sm:grid-cols-4 sm:divide-x">
        {tenant.trustStats.map((stat, i) => (
          <div
            key={stat.id}
            className={`flex flex-col justify-center py-7 sm:py-9 ${i % 2 === 1 ? "pl-6 sm:pl-0" : ""} sm:px-8 sm:first:pl-0 sm:last:pr-0`}
          >
            <div className="font-[var(--font-display)] text-[clamp(22px,2.1vw,30px)] font-bold leading-none tracking-[-0.03em] tabular-nums">
              {stat.value}
            </div>
            <div className="mt-2 text-caption leading-[1.35] tracking-[0.1em] text-[var(--color-ink-faint)] uppercase">
              {label(stat.id)}
            </div>
          </div>
        ))}
      </Container>
    </Section>
  );
}
