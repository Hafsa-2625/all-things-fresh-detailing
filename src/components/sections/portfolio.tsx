import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/tenant/schema";
import { Section, Container, Eyebrow, SectionHeading } from "@/components/ui/section";
import { AdaptiveMedia, type MediaRef } from "@/components/media/adaptive-media";
import { ArrowRight, buttonClass } from "@/components/ui/button";

export interface Project {
  slug: string;
  title: string;
  media?: MediaRef;
}

/**
 * Editorial rather than a uniform thumbnail grid: tiles alternate aspect
 * ratio and column span so the composition reads as automotive photography
 * rather than a gallery. Falls back to a single honest empty state when no
 * projects are published (which is the case until real job photography
 * exists — see docs/seo-system.md).
 */
const TILE_SHAPE = [
  "sm:col-span-7 aspect-[16/10]",
  "sm:col-span-5 aspect-[4/5]",
  "sm:col-span-5 aspect-[4/5]",
  "sm:col-span-7 aspect-[16/10]",
];

export function Portfolio({ dict, locale, projects = [] }: { dict: Dictionary; locale: Locale; projects?: Project[] }) {
  return (
    <Section tone="contrast" id="work" label="06 Recent projects" rhythm="standard">
      <Container className="mb-11 flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div className="max-w-[24ch]">
          <Eyebrow>{dict.portfolio.eyebrow}</Eyebrow>
          <SectionHeading>{dict.portfolio.heading}</SectionHeading>
        </div>
        {projects.length > 0 && (
          <a href={`/${locale}/projects`} className={`group ${buttonClass("text-on-light")}`}>
            {dict.portfolio.viewAll}
            <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        )}
      </Container>

      {projects.length === 0 ? (
        <Container>
          <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] px-8 py-20 text-center">
            <p className="mx-auto max-w-[46ch] text-small leading-[1.7] text-[var(--color-ink-faint)]">
              {dict.portfolio.emptyState}
            </p>
          </div>
        </Container>
      ) : (
        <Container>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-12">
            {projects.map((p, i) => (
              <a
                key={p.slug}
                href={`/${locale}/projects/${p.slug}`}
                className={`group relative overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-cinematic)] ${TILE_SHAPE[i % TILE_SHAPE.length]} aspect-[4/3] sm:aspect-auto`}
              >
                <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.05]">
                  <AdaptiveMedia media={p.media} placeholderLabel={p.title} sizes="(max-width: 640px) 100vw, 50vw" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-70" />
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
                  <h3 className="font-[var(--font-display)] text-body font-bold uppercase tracking-[0.02em] text-white">
                    {p.title}
                  </h3>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/40 text-white transition-[background-color,border-color,color] duration-300 group-hover:border-white group-hover:bg-white group-hover:text-[var(--color-cinematic)]">
                    <ArrowRight />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </Container>
      )}
    </Section>
  );
}
