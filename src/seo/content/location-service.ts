import type { SeoPage } from "../types";
import { locationFacts } from "./locations";
import { allThingsFreshTenant } from "@/tenant/tenants/all-things-fresh";
import { SERVICE_CLUSTER } from "../service-cluster-map";

/**
 * Service × location combination pages (Section 43: `/locations/[location]/[service]/`).
 *
 * Only combinations with a real, hand-written `localNote` below exist.
 * Publishing every service × city with templated, barely-different copy is
 * the "doorway page" pattern the brief prohibits, so empty combinations are
 * not modeled at all. To add one, add its note here.
 */
const localNotes: Record<string, Record<string, string>> = {
  "ceramic-coating": {
    cleveland: "For Cleveland's mix of street parking and driveways, we'll confirm curing conditions before we start — direct sun and extreme cold both affect cure time.",
    "rocky-river": "Rocky River's tree-lined streets mean a lot of driveways get sap and pollen buildup between washes — a ceramic coating's slickness makes that easier to rinse off rather than scrub.",
    westlake: "Between Crocker Park traffic and daily commuting, Westlake vehicles see a lot of miles — ceramic coating is the most-requested service from repeat clients in this area.",
    lakewood: "Lakewood's dense street parking means paint sees more contact with curbs, other cars, and salt spray in winter — the added slickness and UV protection go a long way here.",
  },
  "full-maintenance": {
    cleveland: "For clients working downtown, we schedule around your day rather than requiring you to be home — just tell us where the car will be parked.",
    avon: "Avon's newer, larger properties usually mean more driveway space to work with, which makes scheduling straightforward for a recurring maintenance visit.",
  },
};

const base = (overrides: Omit<SeoPage, "type" | "schema">): SeoPage => ({
  type: "location_service",
  schema: ["Service", "LocalBusiness", "BreadcrumbList"],
  ...overrides,
});

function buildPage(serviceSlug: string, serviceName: string, clusterId: string, loc: (typeof locationFacts)[number], note: string): SeoPage {
  const cityShort = loc.city.split(",")[0];

  return base({
    locale: "en",
    slug: `${loc.slug}-${serviceSlug}`,
    locationSlug: loc.slug,
    serviceSlug,
    clusterId,
    primaryKeyword: `${serviceName.toLowerCase()} ${cityShort}`,
    secondaryKeywords: [`${serviceName.toLowerCase()} near me`, `mobile detailing ${cityShort}`],
    intent: ["commercial"],
    status: "published",
    title: `${serviceName} in ${cityShort}, OH`,
    description: `${serviceName} in ${cityShort}, OH — mobile service that comes to you. ${note}`,
    h1: `${serviceName} in ${cityShort}, OH`,
    intro: `${serviceName} for ${cityShort} vehicles, brought to your home or office. ${note}`,
    sections: [{ body: note }],
    relatedSlugs: [
      { type: "service", slug: serviceSlug },
      { type: "location", slug: loc.slug },
    ],
  });
}

export const locationServicePages: SeoPage[] = allThingsFreshTenant.services.flatMap((service) =>
  locationFacts.flatMap((loc) => {
    const note = localNotes[service.slug]?.[loc.slug];
    return note ? [buildPage(service.slug, service.name, SERVICE_CLUSTER[service.slug] ?? "mobile-detailing", loc, note)] : [];
  }),
);
