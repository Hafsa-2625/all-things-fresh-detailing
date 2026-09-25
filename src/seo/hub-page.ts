import type { SeoPage } from "./types";

export function hubPage(slug: string, title: string, description: string, h1: string, intro: string): SeoPage {
  return {
    type: "static", locale: "en", slug, status: "published", clusterId: slug,
    primaryKeyword: title.toLowerCase(), secondaryKeywords: [], intent: ["navigational"],
    title, description, h1, intro, sections: [{ heading: title, body: intro }], relatedSlugs: [],
    schema: ["BreadcrumbList"],
  };
}
