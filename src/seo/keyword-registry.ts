import type { KeywordCluster } from "./types";

/**
 * The keyword/topic strategy this site's content is built against. Real
 * clusters grouped by search intent — not a page-per-keyword list (Section
 * 44/45 of the brief explicitly forbids that). Spanish keywords are their
 * own entries based on how Spanish-speaking searchers actually phrase these
 * (e.g. "lavado de auto a domicilio", "encerado de auto") — not machine
 * translations of the English strings.
 *
 * `locationBound: true` clusters are meant to be instantiated once per city
 * in `business.serviceCities` (see src/seo/content/location-service.ts) —
 * the keyword strings below use `{city}` as the substitution point.
 */
export const keywordClusters: KeywordCluster[] = [
  // ---------------------------------------------------------------- non-location, commercial
  {
    id: "ceramic-coating",
    label: "Ceramic coating",
    intent: ["commercial"],
    locationBound: false,
    keywords: [
      { keyword: "ceramic coating", priority: 5, locationBound: false },
      { keyword: "ceramic coating for cars", priority: 4, locationBound: false },
      { keyword: "ceramic coating cost", priority: 4, locationBound: false },
      { keyword: "best ceramic coating for cars", priority: 3, locationBound: false },
      { keyword: "9h ceramic coating", priority: 2, locationBound: false },
      { keyword: "recubrimiento cerámico para autos", priority: 4, locationBound: false },
      { keyword: "costo de recubrimiento cerámico", priority: 3, locationBound: false },
    ],
  },
  {
    id: "window-tinting",
    label: "Automotive window tinting",
    intent: ["commercial"],
    locationBound: false,
    keywords: [
      { keyword: "car window tinting", priority: 4, locationBound: false },
      { keyword: "automotive window tinting", priority: 3, locationBound: false },
      { keyword: "window tint installation", priority: 3, locationBound: false },
    ],
  },
  {
    id: "paint-protection-film",
    label: "Paint protection film",
    intent: ["commercial"],
    locationBound: false,
    keywords: [
      { keyword: "paint protection film", priority: 4, locationBound: false },
      { keyword: "car paint protection film", priority: 3, locationBound: false },
      { keyword: "clear bra installation", priority: 3, locationBound: false },
    ],
  },
  {
    id: "paint-correction",
    label: "Paint correction",
    intent: ["commercial"],
    locationBound: false,
    keywords: [
      { keyword: "paint correction", priority: 4, locationBound: false },
      { keyword: "paint correction cost", priority: 3, locationBound: false },
      { keyword: "swirl mark removal", priority: 3, locationBound: false },
      { keyword: "corrección de pintura para auto", priority: 3, locationBound: false },
    ],
  },
  {
    id: "mobile-detailing",
    label: "Mobile detailing",
    intent: ["commercial"],
    locationBound: false,
    keywords: [
      { keyword: "mobile car detailing", priority: 5, locationBound: false },
      { keyword: "mobile detailing service", priority: 4, locationBound: false },
      { keyword: "at-home car detailing", priority: 4, locationBound: false },
      { keyword: "lavado y encerado de auto a domicilio", priority: 4, locationBound: false },
      { keyword: "detailing móvil de autos", priority: 3, locationBound: false },
    ],
  },
  {
    id: "full-detail-package",
    label: "Full detail packages",
    intent: ["commercial"],
    locationBound: false,
    keywords: [
      { keyword: "full car detail", priority: 4, locationBound: false },
      { keyword: "complete car detailing package", priority: 3, locationBound: false },
      { keyword: "interior and exterior detailing", priority: 3, locationBound: false },
      { keyword: "paquete completo de detailing", priority: 3, locationBound: false },
    ],
  },
  {
    id: "interior-detailing",
    label: "Interior detailing",
    intent: ["commercial"],
    locationBound: false,
    keywords: [
      { keyword: "car interior detailing", priority: 4, locationBound: false },
      { keyword: "car interior cleaning service", priority: 4, locationBound: false },
      { keyword: "car seat cleaning service", priority: 3, locationBound: false },
      { keyword: "limpieza de interior de auto", priority: 3, locationBound: false },
    ],
  },
  {
    id: "exterior-detailing",
    label: "Exterior detailing",
    intent: ["commercial"],
    locationBound: false,
    keywords: [
      { keyword: "exterior car detailing", priority: 3, locationBound: false },
      { keyword: "car wax service", priority: 3, locationBound: false },
      { keyword: "hand wash and wax", priority: 2, locationBound: false },
      { keyword: "encerado de auto", priority: 3, locationBound: false },
    ],
  },
  {
    id: "mold-odor-removal",
    label: "Car mold & odor removal",
    intent: ["commercial", "problem_solution"],
    locationBound: false,
    keywords: [
      { keyword: "car mold removal", priority: 3, locationBound: false },
      { keyword: "car odor removal service", priority: 3, locationBound: false },
      { keyword: "remove musty smell from car", priority: 2, locationBound: false },
      { keyword: "eliminar moho del auto", priority: 2, locationBound: false },
    ],
  },
  {
    id: "carpet-upholstery-shampoo",
    label: "Carpet & upholstery shampoo",
    intent: ["commercial"],
    locationBound: false,
    keywords: [
      { keyword: "car carpet shampoo service", priority: 3, locationBound: false },
      { keyword: "car upholstery cleaning", priority: 3, locationBound: false },
      { keyword: "lavado de tapicería de auto", priority: 2, locationBound: false },
    ],
  },
  {
    id: "fleet-dealership",
    label: "Fleet & dealership detailing",
    intent: ["commercial"],
    locationBound: false,
    keywords: [
      { keyword: "dealership detailing service", priority: 3, locationBound: false },
      { keyword: "fleet detailing company", priority: 3, locationBound: false },
      { keyword: "auto dealer detail service", priority: 2, locationBound: false },
      { keyword: "servicio de detailing para concesionarios", priority: 2, locationBound: false },
    ],
  },
  {
    id: "boat-detailing",
    label: "Boat detailing",
    intent: ["commercial"],
    locationBound: false,
    keywords: [
      { keyword: "boat detailing service", priority: 3, locationBound: false },
      { keyword: "boat cleaning and waxing", priority: 2, locationBound: false },
      { keyword: "boat gel coat cleaning", priority: 2, locationBound: false },
      { keyword: "limpieza y encerado de botes", priority: 2, locationBound: false },
    ],
  },
  {
    id: "gift-cards",
    label: "Gift cards",
    intent: ["transactional"],
    locationBound: false,
    keywords: [
      { keyword: "car detailing gift card", priority: 3, locationBound: false },
      { keyword: "detailing gift certificate", priority: 2, locationBound: false },
      { keyword: "tarjeta de regalo para detailing de auto", priority: 2, locationBound: false },
    ],
  },
  {
    id: "luxury-exotic-detailing",
    label: "Luxury & exotic car detailing",
    intent: ["commercial"],
    locationBound: false,
    keywords: [
      { keyword: "exotic car detailing", priority: 2, locationBound: false },
      { keyword: "luxury car detailing service", priority: 3, locationBound: false },
      { keyword: "detailing para autos de lujo", priority: 2, locationBound: false },
    ],
  },
  {
    id: "suv-truck-detailing",
    label: "SUV & truck detailing",
    intent: ["commercial"],
    locationBound: false,
    keywords: [
      { keyword: "SUV detailing service", priority: 3, locationBound: false },
      { keyword: "truck detailing service", priority: 3, locationBound: false },
      { keyword: "detailing para camionetas", priority: 2, locationBound: false },
    ],
  },

  // ---------------------------------------------------------------- non-location, comparison / informational / problem-solution
  {
    id: "ceramic-vs-wax",
    label: "Ceramic coating vs. wax",
    intent: ["comparison", "informational"],
    locationBound: false,
    keywords: [
      { keyword: "ceramic coating vs wax", priority: 4, locationBound: false },
      { keyword: "is ceramic coating better than wax", priority: 3, locationBound: false },
      { keyword: "recubrimiento cerámico vs cera", priority: 2, locationBound: false },
    ],
  },
  {
    id: "ceramic-vs-ppf",
    label: "Ceramic coating vs. PPF",
    intent: ["comparison", "informational"],
    locationBound: false,
    keywords: [
      { keyword: "ceramic coating vs ppf", priority: 3, locationBound: false },
      { keyword: "paint protection film vs ceramic coating", priority: 3, locationBound: false },
    ],
  },
  {
    id: "diy-vs-professional",
    label: "DIY vs. professional detailing",
    intent: ["comparison", "informational"],
    locationBound: false,
    keywords: [
      { keyword: "diy car detailing vs professional", priority: 3, locationBound: false },
      { keyword: "is professional detailing worth it", priority: 2, locationBound: false },
    ],
  },
  {
    id: "how-often-detail",
    label: "Detailing frequency",
    intent: ["informational"],
    locationBound: false,
    keywords: [
      { keyword: "how often should you detail your car", priority: 3, locationBound: false },
      { keyword: "how often to wax car", priority: 2, locationBound: false },
      { keyword: "con qué frecuencia lavar el auto", priority: 2, locationBound: false },
    ],
  },
  {
    id: "prepare-for-mobile-detailing",
    label: "Preparing for a mobile detail",
    intent: ["informational"],
    locationBound: false,
    keywords: [
      { keyword: "how to prepare for mobile detailing", priority: 2, locationBound: false },
      { keyword: "what to expect car detailing appointment", priority: 2, locationBound: false },
    ],
  },
  {
    id: "paint-correction-signs",
    label: "Signs you need paint correction",
    intent: ["problem_solution"],
    locationBound: false,
    keywords: [
      { keyword: "signs you need paint correction", priority: 2, locationBound: false },
      { keyword: "how to tell if car needs paint correction", priority: 2, locationBound: false },
    ],
  },
  {
    id: "maintain-ceramic-coating",
    label: "Maintaining a ceramic coating",
    intent: ["informational"],
    locationBound: false,
    keywords: [
      { keyword: "how to maintain ceramic coating", priority: 3, locationBound: false },
      { keyword: "ceramic coating maintenance wash", priority: 2, locationBound: false },
      { keyword: "cómo mantener el recubrimiento cerámico", priority: 2, locationBound: false },
    ],
  },
  {
    id: "new-car-protection",
    label: "New-car paint protection",
    intent: ["informational", "commercial"],
    locationBound: false,
    keywords: [
      { keyword: "do new cars need ceramic coating", priority: 2, locationBound: false },
      { keyword: "new car paint protection", priority: 2, locationBound: false },
    ],
  },
  {
    id: "choosing-a-detailer",
    label: "Choosing a mobile detailer",
    intent: ["comparison", "commercial"],
    locationBound: false,
    keywords: [
      { keyword: "how to choose a mobile detailer", priority: 2, locationBound: false },
      { keyword: "what to look for in a car detailer", priority: 2, locationBound: false },
    ],
  },
  {
    id: "leather-vs-cloth-care",
    label: "Leather vs. cloth seat care",
    intent: ["informational", "comparison"],
    locationBound: false,
    keywords: [
      { keyword: "leather car seat care", priority: 2, locationBound: false },
      { keyword: "cloth seat cleaning tips", priority: 2, locationBound: false },
    ],
  },
  {
    id: "winter-car-care",
    label: "Winter car care",
    intent: ["informational"],
    locationBound: false,
    keywords: [
      { keyword: "winter car detailing", priority: 3, locationBound: false },
      { keyword: "protect car paint winter road salt", priority: 2, locationBound: false },
      { keyword: "cuidado del auto en invierno", priority: 2, locationBound: false },
    ],
  },
  {
    id: "pet-hair-odor",
    label: "Pet hair & odor removal",
    intent: ["problem_solution"],
    locationBound: false,
    keywords: [
      { keyword: "remove pet hair from car", priority: 3, locationBound: false },
      { keyword: "pet odor removal car", priority: 2, locationBound: false },
    ],
  },
  {
    id: "resale-value-detailing",
    label: "Detailing and resale value",
    intent: ["informational", "commercial"],
    locationBound: false,
    keywords: [
      { keyword: "does detailing increase resale value", priority: 2, locationBound: false },
      { keyword: "detail car before selling", priority: 2, locationBound: false },
    ],
  },

  // ---------------------------------------------------------------- location-bound (instantiated per city)
  {
    id: "detailing-near-me",
    label: "Detailing near me / by city",
    intent: ["commercial", "navigational"],
    locationBound: true,
    keywords: [
      { keyword: "mobile detailing near me", priority: 5, locationBound: true },
      { keyword: "car detailing {city}", priority: 4, locationBound: true },
      { keyword: "mobile car wash {city}", priority: 3, locationBound: true },
      { keyword: "detailing de autos en {city}", priority: 3, locationBound: true },
    ],
  },
  {
    id: "ceramic-coating-city",
    label: "Ceramic coating by city",
    intent: ["commercial"],
    locationBound: true,
    keywords: [
      { keyword: "ceramic coating {city}", priority: 3, locationBound: true },
      { keyword: "recubrimiento cerámico en {city}", priority: 2, locationBound: true },
    ],
  },
  {
    id: "mobile-detailing-city",
    label: "Mobile detailing by city",
    intent: ["commercial"],
    locationBound: true,
    keywords: [
      { keyword: "mobile detailing {city}, OH", priority: 3, locationBound: true },
      { keyword: "at-home car wash {city}", priority: 2, locationBound: true },
    ],
  },
];

export function getCluster(id: string): KeywordCluster {
  const cluster = keywordClusters.find((c) => c.id === id);
  if (!cluster) throw new Error(`Unknown keyword cluster "${id}"`);
  return cluster;
}

export function keywordStats() {
  const nonLocation = keywordClusters.filter((c) => !c.locationBound);
  const location = keywordClusters.filter((c) => c.locationBound);
  const totalKeywords = keywordClusters.reduce((n, c) => n + c.keywords.length, 0);
  return {
    totalClusters: keywordClusters.length,
    nonLocationClusters: nonLocation.length,
    locationClusters: location.length,
    totalKeywords,
  };
}
