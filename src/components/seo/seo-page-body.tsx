import type { TenantConfig } from "@/tenant/schema";
import type { SeoPage } from "@/seo/types";
import { getPageBySlug } from "@/seo/registry";
import { buildPagePath } from "@/seo/metadata";
import { BookNowButton } from "@/components/booking/book-now-button";
import type { Dictionary } from "@/i18n/dictionary";

const RELATED_LABEL: Record<SeoPage["type"], (l: "en" | "es") => string> = {
  service: (l) => (l === "es" ? "Servicios relacionados" : "Related services"),
  location: (l) => (l === "es" ? "Ubicaciones" : "Locations"),
  location_service: (l) => (l === "es" ? "Relacionado" : "Related"),
  project: (l) => (l === "es" ? "Proyectos relacionados" : "Related projects"),
  guide: (l) => (l === "es" ? "Guías relacionadas" : "Related guides"),
  faq: () => "",
  static: () => "",
};

export function SeoPageBody({
  page,
  tenant,
  dict,
  ctaLabel,
}: {
  page: SeoPage;
  tenant: TenantConfig;
  dict: Dictionary;
  ctaLabel?: string;
}) {
  const related = page.relatedSlugs
    .map((r) => getPageBySlug(r.type, r.slug, page.locale))
    .filter((p): p is SeoPage => Boolean(p) && p!.status === "published");

  return (
    <main id="top" className="bg-[var(--color-canvas)]">
      <header className="border-b border-[var(--color-border)] py-[clamp(40px,6vw,80px)]">
        <div className="mx-auto max-w-[880px] px-5 sm:px-8">
          <h1 className="mb-5 font-[var(--font-display)] text-[clamp(28px,4vw,48px)] font-bold leading-[1.05] tracking-[-0.02em] text-balance">
            {page.h1}
          </h1>
          <p className="max-w-[65ch] text-lead leading-[1.7] text-[var(--color-ink-muted)]">{page.intro}</p>
        </div>
      </header>

      {page.sections.length > 0 && (
        <div className="mx-auto max-w-[880px] px-5 py-[clamp(32px,5vw,56px)] sm:px-8">
          {page.sections.map((s, i) => (
            <section key={i} className="mb-8 last:mb-0">
              {s.heading && <h2 className="mb-2.5 text-lead font-bold">{s.heading}</h2>}
              <p className="max-w-[65ch] text-body leading-[1.75] text-[var(--color-ink-muted)]">{s.body}</p>
            </section>
          ))}
        </div>
      )}

      {page.faq && page.faq.length > 0 && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-contrast-raised)] py-[clamp(32px,5vw,56px)]">
          <div className="mx-auto max-w-[880px] px-5 sm:px-8">
            <h2 className="mb-5 text-small font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-faint)]">
              {dict.common.frequentlyAskedQuestions}
            </h2>
            <dl className="flex flex-col gap-5">
              {page.faq.map((f) => (
                <div key={f.question}>
                  <dt className="mb-1.5 text-body font-semibold">{f.question}</dt>
                  <dd className="max-w-[65ch] text-body leading-[1.7] text-[var(--color-ink-muted)]">{f.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      <div className="border-t border-[var(--color-border)] py-[clamp(40px,6vw,72px)]">
        <div className="mx-auto flex max-w-[880px] flex-col items-start gap-6 px-5 sm:px-8">
          <BookNowButton tenant={tenant} label={ctaLabel ?? dict.hero.ctaBook} variant="primary-on-light" size="lg" />

          {related.length > 0 && (
            <div className="w-full border-t border-[var(--color-border)] pt-6">
              <h2 className="mb-3 text-caption font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-faint)]">
                {RELATED_LABEL[page.type](page.locale)}
              </h2>
              <ul className="flex flex-wrap gap-2.5">
                {related.map((r) => (
                  <li key={buildPagePath(r)}>
                    <a
                      href={buildPagePath(r)}
                      className="inline-flex items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3.5 py-1.5 text-small hover:bg-[var(--color-contrast-raised)]"
                    >
                      {r.h1}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
