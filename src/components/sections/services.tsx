import type { TenantConfig, Locale } from "@/tenant/schema";
import type { Dictionary } from "@/i18n/dictionary";
import { Section, Container, Eyebrow, SectionHeading } from "@/components/ui/section";
import { AdaptiveMedia } from "@/components/media/adaptive-media";
import { ArrowRight, buttonClass } from "@/components/ui/button";
import { SERVICE_CLUSTER } from "@/seo/service-cluster-map";
import { getPagesByType } from "@/seo/registry";

function ServicePrice({ service, dict }: { service: TenantConfig["services"][number]; dict: Dictionary }) {
  if (service.pricingMode === "hidden") return null;
  const label =
    service.pricingMode === "quote"
      ? dict.services.requestQuote
      : service.price
        ? service.pricingMode === "starting_at"
          ? `${dict.services.startingAt} $${service.price}`
          : `$${service.price}`
        : null;
  if (!label) return null;
  return (
    <span className="text-caption uppercase tracking-[0.14em] text-white/60">{label}</span>
  );
}

export function Services({ tenant, dict, locale }: { tenant: TenantConfig; dict: Dictionary; locale: Locale }) {
  if (tenant.services.length === 0) return null;

  const servicePages = getPagesByType("service", locale);
  const hrefFor = (slug: string) => {
    const clusterId = SERVICE_CLUSTER[slug];
    const page = servicePages.find((p) => p.clusterId === clusterId && !p.locationSlug);
    return page ? `/${locale}/services/${page.slug}` : `/${locale}/services`;
  };

  return (
    <Section tone="contrast" id="services" label="03 Services" rhythm="standard">
      <Container>
        <div className="mb-11 flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div className="max-w-[22ch]">
            <Eyebrow>{dict.services.eyebrow}</Eyebrow>
            <SectionHeading>{dict.services.heading}</SectionHeading>
          </div>
          <a href={`/${locale}/services`} className={`group ${buttonClass("text-on-light")}`}>
            {dict.services.viewAll}
            <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </div>
      </Container>

      {/* Wider cards than a typical 4-up grid so ~2.5 are visible at desktop —
          the media stays the hero of each card rather than a thumbnail. */}
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:px-8 lg:px-13 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tenant.services.map((service) => (
          <a
            key={service.id}
            href={hrefFor(service.slug)}
            className="group relative h-[clamp(400px,40vw,520px)] w-[min(84vw,clamp(300px,32vw,420px))] shrink-0 snap-start overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-cinematic)] text-[var(--color-ink-inverse)] outline-offset-4"
          >
            <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.06]">
              <AdaptiveMedia media={service.media} placeholderLabel={service.name} sizes="(max-width: 640px) 84vw, 32vw" />
            </div>

            {/* Overlay lightens slightly on hover so the photograph comes forward. */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10 transition-opacity duration-500 group-hover:opacity-85" />

            <div className="absolute inset-x-6 bottom-6">
              <h3 className="mb-2.5 font-[var(--font-display)] text-title font-bold uppercase leading-tight tracking-[0.01em]">
                {service.name}
              </h3>
              <p className="mb-5 max-w-[30ch] text-small leading-[1.55] text-white/70">
                {service.blurb}
              </p>
              <div className="flex items-center justify-between gap-4">
                <ServicePrice service={service} dict={dict} />
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/40 transition-[background-color,border-color] duration-300 group-hover:border-white group-hover:bg-white group-hover:text-[var(--color-cinematic)]">
                  <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </Section>
  );
}
