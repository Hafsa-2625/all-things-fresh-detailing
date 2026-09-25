import type { TenantConfig, Service } from "@/tenant/schema";
import type { SeoPage } from "@/seo/types";
import type { Dictionary } from "@/i18n/dictionary";
import { getPageBySlug } from "@/seo/registry";
import { buildPagePath } from "@/seo/metadata";
import { Section, Container, Eyebrow } from "@/components/ui/section";
import { AdaptiveMedia } from "@/components/media/adaptive-media";
import { BookNowButton } from "@/components/booking/book-now-button";

/**
 * The three starting service-page experiences from Section 22 — built on
 * one shared module system (Hero variant, Benefits, Process, FAQ, Related,
 * Final CTA), not three unrelated implementations. `service.layout` (set
 * per-service in tenantConfig) picks the hero treatment; everything below
 * the hero is the same modular stack for all three, exactly as the brief
 * specifies ("all three MUST use the SAME modular page system").
 */
export function ServiceLayout({
  service,
  page,
  tenant,
  dict,
}: {
  service: Service;
  page: SeoPage;
  tenant: TenantConfig;
  dict: Dictionary;
}) {
  const related = page.relatedSlugs
    .map((r) => getPageBySlug(r.type, r.slug, page.locale))
    .filter((p): p is SeoPage => p !== undefined && p.status === "published");

  return (
    <>
      {service.layout === "cinematic" && <CinematicHero service={service} page={page} tenant={tenant} dict={dict} />}
      {service.layout === "editorial" && <EditorialHero service={service} page={page} tenant={tenant} dict={dict} />}
      {service.layout === "transformation" && <TransformationHero service={service} page={page} tenant={tenant} dict={dict} />}

      {page.sections.length > 0 && (
        <Section tone="contrast" label="Benefits" className="py-[clamp(48px,6vw,88px)]">
          <Container className="max-w-[880px]">
            <Eyebrow>{dict.common.whatsIncluded}</Eyebrow>
            <div className="flex flex-col gap-7">
              {page.sections.map((s, i) => (
                <div key={i}>
                  {s.heading && <h2 className="mb-2 text-lead font-bold">{s.heading}</h2>}
                  <p className="max-w-[65ch] text-body leading-[1.75] text-[var(--color-ink-muted)]">{s.body}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {page.faq && page.faq.length > 0 && (
        <Section tone="cinematic" label="FAQ" className="py-[clamp(48px,6vw,88px)]">
          <Container className="max-w-[880px]">
            <Eyebrow>{dict.common.frequentlyAskedQuestions}</Eyebrow>
            <dl className="flex flex-col gap-6">
              {page.faq.map((f) => (
                <div key={f.question}>
                  <dt className="mb-1.5 text-body font-semibold">{f.question}</dt>
                  <dd className="max-w-[65ch] text-body leading-[1.7] text-[var(--color-ink-inverse-muted)]">{f.answer}</dd>
                </div>
              ))}
            </dl>
          </Container>
        </Section>
      )}

      {related.length > 0 && (
        <Section tone="contrast" label="Related services" className="py-[clamp(40px,5vw,64px)]">
          <Container className="max-w-[880px]">
            <Eyebrow>{dict.common.relatedServices}</Eyebrow>
            <ul className="flex flex-wrap gap-2.5">
              {related.map((r) => (
                <li key={r.slug}>
                  <a href={buildPagePath(r)} className="inline-flex items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] px-4 py-2 text-small hover:bg-[var(--color-contrast-raised)]">
                    {r.h1}
                  </a>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      <Section tone="cinematic" label="Final CTA" className="py-[clamp(48px,6vw,88px)]">
        <Container className="max-w-[880px] text-center">
          <h2 className="mb-6 font-[var(--font-display)] text-[clamp(24px,3vw,36px)] font-bold tracking-[-0.02em]">
            {`${dict.common.bookPrefix} ${page.h1}`}
          </h2>
          <BookNowButton tenant={tenant} label={dict.hero.ctaBook} serviceId={service.id} variant="primary-on-dark" size="lg" className="mx-auto" />
        </Container>
      </Section>
    </>
  );
}

function PriceTag({ service, dict }: { service: Service; dict: Dictionary }) {
  if (service.pricingMode === "hidden") return null;
  if (service.pricingMode === "quote") return <span className="text-small text-[var(--color-ink-inverse-muted)]">{dict.services.requestQuote}</span>;
  if (service.price) return <span className="text-small text-[var(--color-ink-inverse-muted)]">{service.pricingMode === "starting_at" ? `${dict.services.startingAt} $${service.price}` : `$${service.price}`}</span>;
  return null;
}

function CinematicHero({ service, page, tenant, dict }: { service: Service; page: SeoPage; tenant: TenantConfig; dict: Dictionary }) {
  return (
    <Section tone="cinematic" id="top" label="Hero — cinematic" className="relative flex min-h-[min(88vh,860px)] items-end overflow-hidden pt-[76px]">
      <div className="absolute inset-0">
        <AdaptiveMedia media={service.media} placeholderLabel={`${service.name} — add via Media Library`} priority />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--color-cinematic)] via-[var(--color-cinematic)]/50 to-transparent" />
      <Container className="relative py-[clamp(48px,8vw,110px)]">
        <div className="mb-6 flex items-center gap-3.5">
          <div className="h-px w-11 bg-[var(--color-ink-inverse)]" />
          <span className="text-caption font-semibold tracking-[0.3em] text-[var(--color-ink-inverse-muted)]">
            {tenant.brand.name.toUpperCase()}
          </span>
        </div>
        <h1 className="mb-6 max-w-[14ch] font-[var(--font-display)] text-[clamp(40px,7vw,96px)] font-bold uppercase leading-[0.94] tracking-[-0.03em] text-balance">
          {page.h1}
        </h1>
        <p className="mb-9 max-w-[46ch] text-lead leading-[1.6] text-[var(--color-ink-inverse-muted)]">{page.intro}</p>
        <div className="flex flex-wrap items-center gap-6">
          <BookNowButton tenant={tenant} label={dict.hero.ctaBook} serviceId={service.id} variant="primary-on-dark" size="lg" />
          <PriceTag service={service} dict={dict} />
        </div>
      </Container>
    </Section>
  );
}

function EditorialHero({ service, page, tenant, dict }: { service: Service; page: SeoPage; tenant: TenantConfig; dict: Dictionary }) {
  return (
    <Section tone="contrast" id="top" label="Hero — editorial" className="pt-[76px]">
      <Container className="grid grid-cols-1 gap-8 py-[clamp(40px,6vw,80px)] lg:grid-cols-2 lg:items-center">
        <div>
          <Eyebrow>{service.category}</Eyebrow>
          <h1 className="mb-5 font-[var(--font-display)] text-[clamp(30px,4vw,52px)] font-bold tracking-[-0.02em] text-balance">{page.h1}</h1>
          <p className="mb-7 max-w-[52ch] text-body leading-[1.75] text-[var(--color-ink-muted)]">{page.intro}</p>
          <div className="flex flex-wrap items-center gap-5">
            <BookNowButton tenant={tenant} label={dict.hero.ctaBook} serviceId={service.id} variant="primary-on-light" size="lg" />
            <PriceTagLight service={service} dict={dict} />
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
          <AdaptiveMedia media={service.media} placeholderLabel={`${service.name} — add via Media Library`} priority />
        </div>
      </Container>
    </Section>
  );
}
function PriceTagLight({ service, dict }: { service: Service; dict: Dictionary }) {
  if (service.pricingMode === "hidden") return null;
  if (service.pricingMode === "quote") return <span className="text-small text-[var(--color-ink-muted)]">{dict.services.requestQuote}</span>;
  if (service.price) return <span className="text-small text-[var(--color-ink-muted)]">{service.pricingMode === "starting_at" ? `${dict.services.startingAt} $${service.price}` : `$${service.price}`}</span>;
  return null;
}

function TransformationHero({ service, page, tenant, dict }: { service: Service; page: SeoPage; tenant: TenantConfig; dict: Dictionary }) {
  return (
    <Section tone="cinematic" id="top" label="Hero — transformation" className="pt-[76px]">
      <Container className="py-[clamp(36px,5vw,72px)]">
        <Eyebrow>{dict.common.beforeAfter}</Eyebrow>
        <h1 className="mb-6 max-w-[16ch] font-[var(--font-display)] text-[clamp(30px,4vw,52px)] font-bold uppercase tracking-[-0.02em] text-balance">
          {page.h1}
        </h1>
        <p className="mb-8 max-w-[54ch] text-body leading-[1.75] text-[var(--color-ink-inverse-muted)]">{page.intro}</p>
        <BookNowButton tenant={tenant} label={dict.hero.ctaBook} serviceId={service.id} variant="primary-on-dark" size="lg" />
      </Container>
      <div className="relative aspect-[21/9] min-h-[280px] w-full bg-[var(--color-cinematic-raised)]">
        <AdaptiveMedia media={service.media} placeholderLabel={`${service.name} before/after — add via Media Library`} />
      </div>
    </Section>
  );
}
