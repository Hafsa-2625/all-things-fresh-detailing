import type { Locale } from "@/tenant/schema";

/** What kind of page this is — drives which schema.org types, internal-link
 * rules, and quality-gate checks apply (Section 43/47/50 of the brief). */
export type SeoPageType =
  | "service"
  | "location"
  | "location_service"
  | "project"
  | "guide"
  | "faq"
  | "static";

/** Search-intent classification (Section 44/45). One page can carry more
 * than one — a comparison guide is both informational and commercial. */
export type SearchIntent =
  | "commercial"
  | "transactional"
  | "informational"
  | "comparison"
  | "problem_solution"
  | "navigational";

export type PageStatus = "draft" | "published";

export interface KeywordTarget {
  keyword: string;
  /** Approx monthly-search-style priority, 1 (low) – 5 (high). Not a real
   * volume number (no keyword-tool data available) — a directional signal
   * for which cluster to write toward first. */
  priority: 1 | 2 | 3 | 4 | 5;
  locationBound: boolean;
}

export interface KeywordCluster {
  id: string;
  label: string;
  intent: SearchIntent[];
  /** True if this cluster only makes sense tied to a city/service area. */
  locationBound: boolean;
  keywords: KeywordTarget[];
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface SeoPage {
  type: SeoPageType;
  locale: Locale;
  slug: string;
  /** Locale-independent identity for pages whose slug is translated
   * ("about" ↔ "nosotros"). Lets navigation resolve the right slug per
   * locale instead of assuming the English one exists in every language —
   * see resolvePath() in metadata.ts. */
  pageKey?: string;
  /** For location_service pages: the location slug + service slug that compose it. */
  locationSlug?: string;
  serviceSlug?: string;

  status: PageStatus;
  /** Why a draft page isn't published yet — shown in /admin, never on the
   * public site. Required when status is "draft". */
  draftReason?: string;
  /** A published page can still be forced noindex (e.g. a placeholder legal
   * page that must exist to avoid a broken internal link, but shouldn't rank
   * while its content is still a placeholder). Independent of `status` —
   * status controls whether the ROUTE exists at all; this only controls the
   * robots meta tag. */
  forceNoindex?: boolean;

  clusterId: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: SearchIntent[];

  title: string;
  description: string;
  h1: string;
  /** Short standfirst/intro paragraph — required by the quality gate. */
  intro: string;

  /** Rendered body content. Kept as structured blocks (not one HTML blob)
   * so it's editable field-by-field once this moves behind the CMS. */
  sections: { heading?: string; body: string }[];

  /** Last content update, ISO date (YYYY-MM-DD). Shown on article pages and in structured data. */
  updatedAt?: string;

  faq?: FaqEntry[];

  /** Slugs of other SeoPages (same locale) this page should link to. */
  relatedSlugs: { type: SeoPageType; slug: string }[];

  schema: ("LocalBusiness" | "Service" | "FAQPage" | "Article" | "BreadcrumbList")[];
}
