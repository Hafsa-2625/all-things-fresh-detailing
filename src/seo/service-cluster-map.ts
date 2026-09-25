/**
 * tenantConfig service slugs are locale-neutral (always English — "ceramic-coating",
 * "full-maintenance", ...). SEO service pages are per-locale content with their
 * own slugs (Spanish content isn't a slug-for-slug translation — "recubrimiento-ceramico",
 * not "ceramic-coating"). This is the single place that maps one to the other,
 * via the keyword cluster both reference.
 *
 * Pure data, no imports — kept dependency-free on purpose so every content
 * file and route that needs the mapping can import it without risking a
 * circular import through registry.ts (which itself imports the content
 * files that would otherwise need this map).
 */
export const SERVICE_CLUSTER: Record<string, string> = {
  "full-maintenance": "full-detail-package",
  "gold-premium": "full-detail-package",
  "masterpiece-detail": "full-detail-package",
  "exterior-maintenance": "exterior-detailing",
  "wax-buff": "exterior-detailing",
  "ceramic-coating": "ceramic-coating",
  "interior-maintenance": "interior-detailing",
  "deep-shampoo": "carpet-upholstery-shampoo",
  "mold-reset": "mold-odor-removal",
  "fleet-dealership": "fleet-dealership",
  "boat-detailing": "boat-detailing",
};
