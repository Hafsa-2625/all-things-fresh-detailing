import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getTenant } from "@/tenant/get-tenant";
import { locationServicePages } from "@/seo/content/location-service";
import { locationFacts } from "@/seo/content/locations";
import { getPageBySlug, isActuallyPublishable } from "@/seo/registry";
import { buildMetadata } from "@/seo/metadata";
import { LockedSubpage } from "@/components/locked-design/locked-subpage";
import { loadCmsPageByPath, loadPublicPage } from "@/lib/content/public-page";
import { allThingsFreshTenant } from "@/tenant/tenants/all-things-fresh";

function comboSlug(location: string, service: string) { return `${location}-${service}`; }

export function generateStaticParams() { return locationServicePages.filter(isActuallyPublishable).map((p) => ({ lang:p.locale, location:p.locationSlug!, service:p.serviceSlug! })); }

/**
 * Code-defined combinations first; otherwise a published CMS page (Content fields → Pages, template
 * "location-service") at /service-area/<city>-oh/<service>, for a known city and service only.
 */
async function load(location: string, service: string, lang: "en" | "es") {
  const page = getPageBySlug("location_service", comboSlug(location, service), lang);
  if (page && isActuallyPublishable(page)) return loadPublicPage(page);
  const known = lang === "en" && locationFacts.some((loc) => loc.slug === location) && allThingsFreshTenant.services.some((entry) => entry.slug === service);
  if (!known) notFound();
  const cmsPage = await loadCmsPageByPath(`/service-area/${location}-oh/${service}`, "location_service", comboSlug(location, service), lang);
  if (!cmsPage) notFound();
  return { ...cmsPage, locationSlug: location, serviceSlug: service };
}

export async function generateMetadata({params}:PageProps<"/[lang]/locations/[location]/[service]">){const {lang,location,service}=await params;if(!isLocale(lang))notFound();return buildMetadata(await load(location,service,lang),await getTenant());}
export default async function LocationServicePage({params}:PageProps<"/[lang]/locations/[location]/[service]">){const {lang,location,service}=await params;if(!isLocale(lang))notFound();return <LockedSubpage page={await load(location,service,lang)} template="service"/>;}
