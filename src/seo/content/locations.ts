import type { SeoPage } from "../types";
import { LOCATION_SLUGS_BY_LOCALE } from "@/i18n/routes";

interface LocationFact {
  slug: string;
  city: string;
  /** One genuine, general geographic fact — no fabricated customer claims. */
  context: string;
}

export const locationFacts: LocationFact[] = [
  { slug: "cleveland", city: "Cleveland, OH", context: "Ohio's second-largest city and the hub of the service area — from downtown to the near West Side neighborhoods." },
  { slug: "rocky-river", city: "Rocky River, OH", context: "a Lake Erie suburb just west of Cleveland, known for Rocky River Reservation and its walkable downtown." },
  { slug: "westlake", city: "Westlake, OH", context: "a western suburb built around Crocker Park, with a mix of established neighborhoods and newer development." },
  { slug: "avon", city: "Avon, OH", context: "one of the fastest-growing communities west of Cleveland, with newer subdivisions spread across a larger footprint." },
  { slug: "bay-village", city: "Bay Village, OH", context: "a quiet Lake Erie suburb between Rocky River and Westlake, mostly single-family homes with driveway access." },
  { slug: "lakewood", city: "Lakewood, OH", context: "a dense, walkable inner-ring suburb right next to Cleveland, with a lot of street parking and multi-family housing." },
  { slug: "north-olmsted", city: "North Olmsted, OH", context: "a western suburb near Cleveland Hopkins Airport, with a mix of ranch-style homes and commercial corridors." },
];

const base = (overrides: Omit<SeoPage, "type" | "status" | "schema">): SeoPage => ({
  type: "location",
  status: "published",
  schema: ["LocalBusiness", "BreadcrumbList"],
  ...overrides,
});

export const locationPages: SeoPage[] = locationFacts.map((loc) =>
  base({
    locale: "en",
    slug: loc.slug,
    clusterId: "detailing-near-me",
    primaryKeyword: `car detailing ${loc.city.split(",")[0]}`,
    secondaryKeywords: [`mobile detailing ${loc.city.split(",")[0]}`, "mobile detailing near me"],
    intent: ["commercial", "navigational"],
    title: `Mobile Car Detailing in ${loc.city}`,
    description: `Mobile car detailing in ${loc.city} — we come to your home or office with the full lineup of services, from a maintenance wash to ceramic coating.`,
    h1: `Mobile Car Detailing in ${loc.city}`,
    intro: `All Things Fresh serves ${loc.city}, ${loc.context} We bring the full shop to your driveway or connect at our own location — whichever fits your schedule better.`,
    sections: [
      {
        heading: "How mobile service works here",
        body: `We bring water and power on request, so most jobs in ${loc.city.split(",")[0]} don't need anything from you beyond a place to park. If your setup makes mobile service impractical, our shop is a straightforward option instead.`,
      },
      {
        heading: "Popular services in this area",
        body: "Full Maintenance and Ceramic Coating are the two most-booked services across our service area — see the full list below or book directly.",
      },
    ],
    relatedSlugs: [
      { type: "service", slug: "full-maintenance" },
      { type: "service", slug: "ceramic-coating" },
      { type: "location", slug: "cleveland" },
    ],
  }),
);

// A meaningful subset in Spanish — remaining cities are English-only for now
// (READY FOR BACKEND WIRING once a translation workflow exists — see
// docs/architecture.md).
export const locationPagesEs: SeoPage[] = [
  base({
    locale: "es",
    slug: "cleveland",
    clusterId: "detailing-near-me",
    primaryKeyword: "detailing de autos en Cleveland",
    secondaryKeywords: ["detailing móvil cerca de mí"],
    intent: ["commercial", "navigational"],
    title: "Detailing Móvil de Autos en Cleveland, OH",
    description: "Detailing móvil de autos en Cleveland, OH — vamos a tu casa u oficina con el servicio completo, desde un lavado de mantenimiento hasta recubrimiento cerámico.",
    h1: "Detailing Móvil de Autos en Cleveland, OH",
    intro: "All Things Fresh atiende Cleveland, la ciudad principal de nuestra área de servicio. Llevamos el taller completo hasta tu entrada de auto, o puedes visitarnos — lo que se ajuste mejor a tu horario.",
    sections: [
      { heading: "Cómo funciona el servicio móvil", body: "Llevamos agua y electricidad si las necesitas, así que la mayoría de los servicios en Cleveland no requieren nada de tu parte más que un lugar para estacionar." },
    ],
    relatedSlugs: [
      { type: "service", slug: "recubrimiento-ceramico" },
      { type: "service", slug: "mantenimiento-completo" },
    ],
  }),
  base({
    locale: "es",
    slug: "lakewood",
    clusterId: "detailing-near-me",
    primaryKeyword: "detailing de autos en Lakewood",
    secondaryKeywords: ["detailing móvil cerca de mí"],
    intent: ["commercial", "navigational"],
    title: "Detailing Móvil de Autos en Lakewood, OH",
    description: "Detailing móvil de autos en Lakewood, OH — servicio a domicilio con la línea completa de servicios.",
    h1: "Detailing Móvil de Autos en Lakewood, OH",
    intro: "All Things Fresh atiende Lakewood, un suburbio denso y caminable justo al lado de Cleveland. Trabajamos bien con espacios de estacionamiento en la calle — solo dinos dónde estará el auto.",
    sections: [
      { heading: "Cómo funciona el servicio móvil", body: "Si tu auto está en la calle en lugar de una entrada privada, dínoslo al reservar y ajustamos el servicio según corresponda." },
    ],
    relatedSlugs: [
      { type: "service", slug: "recubrimiento-ceramico" },
    ],
  }),
];

/**
 * `src/i18n/routes.ts` mirrors which cities have a page per locale (it can't
 * import this file — navigation components are client components and would
 * pull all page content into the bundle). This check makes drift a loud
 * build/dev failure instead of a silent 404 in the footer.
 */
function assertRouteMapInSync() {
  const actual = {
    en: locationPages.map((p) => p.slug).sort(),
    es: locationPagesEs.map((p) => p.slug).sort(),
  };
  for (const locale of ["en", "es"] as const) {
    const mirrored = [...LOCATION_SLUGS_BY_LOCALE[locale]].sort();
    if (JSON.stringify(mirrored) !== JSON.stringify(actual[locale])) {
      throw new Error(
        `LOCATION_SLUGS_BY_LOCALE.${locale} in src/i18n/routes.ts is out of sync with the location pages defined here.\n` +
          `  routes.ts: ${mirrored.join(", ")}\n  actual:    ${actual[locale].join(", ")}`,
      );
    }
  }
}
assertRouteMapInSync();
