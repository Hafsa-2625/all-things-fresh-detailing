import type { Locale } from "@/tenant/schema";

/**
 * Locale-specific slugs for the handful of standalone pages whose URL is
 * itself translated ("about" ↔ "nosotros"). Lives in the i18n layer, not the
 * SEO content layer, because navigation components are client components —
 * importing the full SEO registry into them would pull all page content into
 * the client bundle. `src/seo/content/static-pages.ts` derives its slugs from
 * this map, so the two can't drift.
 *
 * A `null` means that page doesn't exist in that locale yet; callers must
 * hide the link rather than render one that 404s (a real bug the route
 * crawl caught — see `npm run qa:crawl`).
 */
export const STATIC_ROUTE_SLUGS = {
  about: { en: "about", es: "nosotros" },
  contact: { en: "contact", es: "contacto" },
  "gift-cards": { en: "gift-cards", es: "gift-cards" },
  terms: { en: "terms", es: "terms" },
  privacy: { en: "privacy", es: "privacy" },
} as const satisfies Record<string, Record<Locale, string>>;

export type StaticRouteKey = keyof typeof STATIC_ROUTE_SLUGS;

export function staticPath(key: StaticRouteKey, locale: Locale): string {
  return `/${locale}/${STATIC_ROUTE_SLUGS[key][locale]}`;
}

/**
 * Cities with a published location page, per locale. Kept here (rather than
 * derived from the registry) for the same client-bundle reason as above;
 * `src/seo/content/locations.ts` is the source these are mirrored from and a
 * unit-free assertion in that file keeps them honest.
 */
export const LOCATION_SLUGS_BY_LOCALE: Record<Locale, string[]> = {
  en: ["cleveland", "rocky-river", "westlake", "avon", "bay-village", "lakewood", "north-olmsted"],
  es: ["cleveland", "lakewood"],
};

export function hasLocationPage(slug: string, locale: Locale): boolean {
  return LOCATION_SLUGS_BY_LOCALE[locale].includes(slug);
}
