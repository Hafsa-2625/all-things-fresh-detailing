import type { TenantConfig } from "@/tenant/schema";
import type { Dictionary } from "@/i18n/dictionary";
import { Section, Container, Eyebrow } from "@/components/ui/section";
import { AdaptiveMedia } from "@/components/media/adaptive-media";
import { BookNowButton } from "@/components/booking/book-now-button";
import { TrackedTelLink } from "@/components/analytics/tracked-tel-link";
import { buttonClass } from "@/components/ui/button";

export function FinalCta({ tenant, dict }: { tenant: TenantConfig; dict: Dictionary }) {
  const telHref = `tel:${tenant.business.phone.replace(/[^0-9+]/g, "")}`;

  return (
    <Section
      tone="cinematic"
      label="11 Final CTA"
      rhythm="none"
      className="relative flex min-h-[min(76vh,660px)] items-center overflow-hidden"
    >
      <div className="absolute inset-0 opacity-45">
        <AdaptiveMedia placeholderLabel="Final CTA background — add via Media Library" sizes="100vw" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(95deg, var(--color-cinematic) 0%, color-mix(in srgb, var(--color-cinematic) 78%, transparent) 46%, color-mix(in srgb, var(--color-cinematic) 45%, transparent) 100%)",
        }}
      />

      <Container className="relative py-[clamp(64px,8vw,120px)]">
        <Eyebrow tone="inverse">{dict.finalCta.eyebrow}</Eyebrow>
        <h2 className="mb-8 max-w-[15ch] font-[var(--font-display)] text-[clamp(34px,4.8vw,76px)] font-bold uppercase leading-[0.94] tracking-[-0.04em] text-balance">
          {dict.finalCta.heading}
        </h2>
        <p className="mb-10 max-w-[42ch] text-body leading-[1.7] text-[var(--color-ink-inverse-muted)]">
          {dict.finalCta.body}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <BookNowButton tenant={tenant} label={dict.finalCta.ctaBook} variant="primary-on-dark" size="lg" />
          <TrackedTelLink href={telHref} className={buttonClass("secondary-on-dark", "lg")}>
            {tenant.business.phone}
          </TrackedTelLink>
        </div>
      </Container>
    </Section>
  );
}
