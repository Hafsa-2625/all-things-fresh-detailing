import type { Locale } from "@/tenant/schema";
import type { SeoPage, SeoPageType } from "./types";
import { buildPagePath } from "./metadata";

const TYPE_HUB_LABEL: Record<SeoPageType, { en: string; es: string; path: (locale: Locale) => string } | null> = {
  service: { en: "Services", es: "Servicios", path: (l) => `/${l}/services` },
  location: { en: "Locations", es: "Ubicaciones", path: (l) => `/${l}/locations` },
  location_service: { en: "Locations", es: "Ubicaciones", path: (l) => `/${l}/locations` },
  project: { en: "Our Work", es: "Nuestro Trabajo", path: (l) => `/${l}/projects` },
  guide: { en: "Guides", es: "Guías", path: (l) => `/${l}/guides` },
  faq: null,
  static: null,
};

/** Home → section hub → page, per Section 47/50's breadcrumb requirement. */
export function buildBreadcrumbs(page: SeoPage): { label: string; path: string }[] {
  const home = { label: page.locale === "es" ? "Inicio" : "Home", path: `/${page.locale}` };
  const hub = TYPE_HUB_LABEL[page.type];
  const crumbs = [home];

  if (hub) {
    crumbs.push({ label: page.locale === "es" ? hub.es : hub.en, path: hub.path(page.locale) });
  }

  if (page.type === "location_service" && page.locationSlug) {
    const locationHubPath = `/${page.locale}/locations/${page.locationSlug}`;
    crumbs.push({ label: page.locationSlug, path: locationHubPath });
  }

  crumbs.push({ label: page.h1, path: buildPagePath(page) });
  return crumbs;
}
