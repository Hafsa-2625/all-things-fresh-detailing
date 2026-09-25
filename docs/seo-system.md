# SEO System

The SEO layer is a typed publishing system, not a folder of cloned city pages.

## Sources

- `keyword-registry.ts`: search-intent/topic clusters.
- `content/`: services, locations, selective location-service pages, guides, FAQ, static pages, and draft case-study templates.
- `quality-gate.ts`: publication rules.
- `registry.ts`: central status and reporting.
- `metadata.ts` and `schema.ts`: canonical metadata and structured data.
- `sitemap.ts` and `robots.ts`: crawler directives.

## Current counts

- 69 indexable public URLs after adding the home and hub/conversion routes.
- 6 published noindex URLs.
- 90 draft opportunities.
- 31 clusters, 96 source terms, and 144 expanded phrases.
- 0 same-locale primary-keyword duplicates.

Run:

```bash
npm run seo:stats
npm run seo:report
npm run seo:export
```

## Publishing rules

Registry pages must be published and pass the quality gate. CMS records must have an approved template type, published status, heading, intro, and structured sections. Noindex stays available for legal/review/case-study staging. New CMS URLs render through the frozen service, location, article, case-study, or static template and enter the sitemap after revalidation.

Location-service combinations remain draft unless they have genuinely differentiated copy. This protects the domain from doorway-page patterns and gives the team a controlled backlog.
