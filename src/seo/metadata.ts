import type { Metadata } from "next";
import type { TenantConfig } from "@/tenant/schema";
import type { SeoPage } from "./types";
import { allSeoPages } from "./registry";

const TYPE_BASE_PATH: Record<SeoPage["type"], string> = {
  service: "services",
  location: "service-area",
  location_service: "service-area",
  project: "our-work",
  guide: "resources",
  faq: "faq",
  static: "",
};

export function buildPagePath(page: SeoPage): string {
  const base = page.locale === "en" ? "" : `/${page.locale}`;
  if (page.type === "location_service" && page.locationSlug && page.serviceSlug) {
    return `${base}/service-area/${page.locationSlug}-oh/${page.serviceSlug}`;
  }
  if (page.type === "faq") return `${base}/faq`;
  if (page.type === "static") return `${base}/${page.slug}`;
  if (page.type === "location") return `${base}/service-area/${page.slug}-oh`;
  return `${base}/${TYPE_BASE_PATH[page.type]}/${page.slug}`;
}

/**
 * Other-locale version(s) of the same conceptual page, matched by type +
 * cluster (slugs can't be compared directly across languages — Spanish
 * content isn't a slug-for-slug translation, e.g. "ceramic-coating" vs
 * "recubrimiento-ceramico"). Only returns a match when it's unambiguous:
 * some clusters intentionally cover several same-locale pages (Full
 * Maintenance / Gold Premium / Masterpiece Detail all share the
 * "full-detail-package" cluster as pricing tiers of one concept) — in that
 * case declaring any one of them as "the" Spanish alternate would be
 * wrong, so none are declared until dedicated per-tier translations exist.
 */
export function findAlternates(page: SeoPage): SeoPage[] {
  const sameLocaleSiblings = allSeoPages.filter(
    (p) => p !== page && p.locale === page.locale && p.type === page.type && p.clusterId === page.clusterId,
  );
  if (sameLocaleSiblings.length > 0) return []; // ambiguous on our own side too

  const candidates = allSeoPages.filter(
    (p) =>
      p.locale !== page.locale &&
      p.type === page.type &&
      p.clusterId === page.clusterId &&
      p.locationSlug === page.locationSlug &&
      p.serviceSlug === page.serviceSlug,
  );
  return candidates.length === 1 ? candidates : [];
}

export function buildMetadata(page: SeoPage, tenant: TenantConfig): Metadata {
  const path = buildPagePath(page);
  const alternates = findAlternates(page);
  const languages: Record<string, string> = { [page.locale]: path };
  for (const alt of alternates) languages[alt.locale] = buildPagePath(alt);

  const shouldIndex = page.status === "published" && !page.forceNoindex;

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: path,
      languages: Object.keys(languages).length > 1
        ? { ...languages, "x-default": languages[tenant.languages.default] ?? path }
        : undefined,
    },
    robots: shouldIndex ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: page.title,
      description: page.description,
      siteName: tenant.brand.name,
      locale: page.locale,
      type: page.type === "guide" ? "article" : "website",
    },
  };
}
