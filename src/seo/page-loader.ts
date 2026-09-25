import { notFound } from "next/navigation";
import type { Locale } from "@/tenant/schema";
import type { SeoPageType } from "./types";
import { getPageBySlug, isActuallyPublishable } from "./registry";
import { loadCmsPageByPath, loadPublicPage } from "@/lib/content/public-page";

/** Shared by every dynamic SEO route: 404 for anything that isn't actually
 * publishable (whether it's missing, marked draft, or fails the quality
 * gate) rather than each route re-implementing that check. */
export function loadPublishedPage(type: SeoPageType, slug: string, locale: Locale) {
  const page = getPageBySlug(type, slug, locale);
  if (!page || !isActuallyPublishable(page)) notFound();
  return page;
}

function publicPath(type: Exclude<SeoPageType, "location_service" | "faq">, slug: string, locale: Locale) {
  const prefix = locale === "en" ? "" : `/${locale}`;
  if (type === "service") return `${prefix}/services/${slug}`;
  if (type === "location") return `${prefix}/service-area/${slug}-oh`;
  if (type === "guide") return `${prefix}/resources/${slug}`;
  if (type === "project") return `${prefix}/our-work/${slug}`;
  return `${prefix}/${slug}`;
}

/** Registry-first resolver with a design-safe CMS fallback for newly created URLs. */
export async function resolvePublishedPage(
  type: Exclude<SeoPageType, "location_service" | "faq">,
  slug: string,
  locale: Locale,
) {
  const page = getPageBySlug(type, slug, locale);
  if (page && isActuallyPublishable(page)) return loadPublicPage(page);
  const cmsPage = await loadCmsPageByPath(publicPath(type, slug, locale), type, slug, locale);
  if (!cmsPage) notFound();
  return cmsPage;
}
