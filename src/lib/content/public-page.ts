import "server-only";

import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { SeoPage } from "@/seo/types";
import { buildPagePath } from "@/seo/metadata";
import type { Locale } from "@/tenant/schema";

type CmsSection = { heading?: string; body: string };
type CmsPageRow = {
  title?: string | null;
  page_type?: string | null;
  eyebrow?: string | null;
  heading?: string | null;
  intro?: string | null;
  sections?: unknown;
  seo_title?: string | null;
  seo_description?: string | null;
  robots?: string | null;
  schema_json?: unknown;
  updated_at?: string | null;
};

function cmsClient() {
  return createPublicSupabaseClient();
}

async function readCmsPage(path: string): Promise<CmsPageRow | null> {
  const client = cmsClient();
  if (!client) return null;
  const { data, error } = await client
    .from("content_pages")
    .select("title,page_type,eyebrow,heading,intro,sections,seo_title,seo_description,robots,schema_json,updated_at")
    .eq("tenant_id", "all-things-fresh")
    .eq("slug", path)
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<CmsPageRow>();
  return error ? null : data;
}

function validSections(value: unknown): CmsSection[] | null {
  if (!Array.isArray(value)) return null;
  const rows = value.filter((item): item is CmsSection => {
    if (!item || typeof item !== "object") return false;
    const row = item as Record<string, unknown>;
    return typeof row.body === "string" && (row.heading === undefined || typeof row.heading === "string");
  });
  return rows.length === value.length ? rows : null;
}

/**
 * Applies a published, field-level CMS override to a registry page. The
 * layout/template never comes from the database, so staff can update copy,
 * metadata and structured sections without changing the approved design.
 */
export async function loadPublicPage(page: SeoPage): Promise<SeoPage> {
  try {
    const data = await readCmsPage(buildPagePath(page));
    if (!data) return page;

    const sections = validSections(data.sections);
    const robots = String(data.robots || "").toLowerCase();
    return {
      ...page,
      h1: data.heading?.trim() || page.h1,
      intro: data.intro?.trim() || page.intro,
      sections: sections?.length ? sections : page.sections,
      title: data.seo_title?.trim() || page.title,
      description: data.seo_description?.trim() || page.description,
      forceNoindex: robots.includes("noindex") ? true : page.forceNoindex,
      updatedAt: data.updated_at?.slice(0, 10) || page.updatedAt,
    };
  } catch (error) {
    console.warn("[content] Published CMS override could not be loaded; using versioned source content.", error);
    return page;
  }
}

const defaultIntent: Record<SeoPage["type"], SeoPage["intent"]> = {
  service: ["commercial"],
  location: ["commercial", "navigational"],
  location_service: ["commercial"],
  project: ["commercial", "informational"],
  guide: ["informational"],
  faq: ["informational"],
  static: ["navigational"],
};

const defaultSchema: Record<SeoPage["type"], SeoPage["schema"]> = {
  service: ["Service", "BreadcrumbList"],
  location: ["LocalBusiness", "BreadcrumbList"],
  location_service: ["Service", "LocalBusiness", "BreadcrumbList"],
  project: ["Article", "BreadcrumbList"],
  guide: ["Article", "BreadcrumbList"],
  faq: ["FAQPage", "BreadcrumbList"],
  static: ["BreadcrumbList"],
};

/** Resolves a new published CMS URL that does not exist in the versioned registry. */
export async function loadCmsPageByPath(
  path: string,
  type: SeoPage["type"],
  slug: string,
  locale: Locale,
): Promise<SeoPage | null> {
  try {
    const data = await readCmsPage(path);
    if (!data) return null;
    const cmsType = data.page_type?.replace("-", "_");
    const typeMatches = !cmsType || cmsType === type || (type === "project" && cmsType === "case_study") || (type === "guide" && cmsType === "article");
    if (!typeMatches) return null;
    const sections = validSections(data.sections) ?? [];
    const heading = data.heading?.trim() || data.title?.trim();
    const intro = data.intro?.trim();
    if (!heading || !intro) return null;
    const robots = String(data.robots || "index,follow").toLowerCase();
    return {
      type,
      locale,
      slug,
      status: "published",
      forceNoindex: robots.includes("noindex"),
      clusterId: `cms-${type}-${slug}`,
      primaryKeyword: data.eyebrow?.trim() || heading,
      secondaryKeywords: [],
      intent: defaultIntent[type],
      title: data.seo_title?.trim() || data.title?.trim() || heading,
      description: data.seo_description?.trim() || intro.slice(0, 160),
      h1: heading,
      intro,
      sections: sections.length ? sections : [{ body: intro }],
      relatedSlugs: [],
      schema: defaultSchema[type],
      updatedAt: data.updated_at?.slice(0, 10) || undefined,
    };
  } catch (error) {
    console.warn("[content] Dynamic CMS page could not be loaded.", error);
    return null;
  }
}
