import type { Locale } from "@/tenant/schema";
import type { SeoPage, SeoPageType } from "./types";
import { servicePages } from "./content/services";
import { locationPages, locationPagesEs } from "./content/locations";
import { locationServicePages } from "./content/location-service";
import { guidePages } from "./content/guides";
import { faqPages } from "./content/faq";
import { staticPages } from "./content/static-pages";
import { runQualityGate } from "./quality-gate";

/** Every SEO-managed page across every content type and locale. */
export const allSeoPages: SeoPage[] = [
  ...servicePages,
  ...locationPages,
  ...locationPagesEs,
  ...locationServicePages,
  ...guidePages,
  ...faqPages,
  ...staticPages,
];

/**
 * The quality gate is re-run here, not trusted from each content file's
 * `status` field — so a page can never end up published just because
 * someone forgot to flip a flag (Section 46: "Insufficient pages: DRAFT or
 * NOINDEX", enforced automatically, not by convention).
 */
export function isActuallyPublishable(page: SeoPage): boolean {
  if (page.status !== "published") return false;
  return runQualityGate(page, allSeoPages).publishable;
}

export function getPublishedPages(locale?: Locale): SeoPage[] {
  return allSeoPages.filter((p) => isActuallyPublishable(p) && (!locale || p.locale === locale));
}

export function getPageBySlug(type: SeoPageType, slug: string, locale: Locale): SeoPage | undefined {
  return allSeoPages.find((p) => p.type === type && p.slug === slug && p.locale === locale);
}

export function getPagesByType(type: SeoPageType, locale: Locale, publishedOnly = true): SeoPage[] {
  return allSeoPages.filter(
    (p) => p.type === type && p.locale === locale && (!publishedOnly || isActuallyPublishable(p)),
  );
}

/** For the admin SEO dashboard — every page with its live gate result, not just the declared status. */
export function getAllPagesWithGateStatus() {
  return allSeoPages.map((page) => ({ page, gate: runQualityGate(page, allSeoPages) }));
}

export function registryStats() {
  const byType = new Map<SeoPageType, { published: number; draft: number }>();
  for (const page of allSeoPages) {
    const entry = byType.get(page.type) ?? { published: 0, draft: 0 };
    if (isActuallyPublishable(page)) entry.published += 1;
    else entry.draft += 1;
    byType.set(page.type, entry);
  }

  const published = allSeoPages.filter(isActuallyPublishable);
  const nonLocationTypes: SeoPageType[] = ["service", "guide", "faq", "static"];
  const nonLocationPublished = published.filter((p) => nonLocationTypes.includes(p.type)).length;

  return {
    totalPages: allSeoPages.length,
    totalPublished: published.length,
    totalDraft: allSeoPages.length - published.length,
    byType: Object.fromEntries(byType),
    nonLocationPublished,
    nonLocationSharePct: published.length ? Math.round((nonLocationPublished / published.length) * 100) : 0,
  };
}
