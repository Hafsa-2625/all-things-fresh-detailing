import type { MetadataRoute } from "next";
import { getTenant } from "@/tenant/get-tenant";
import { getPublishedPages } from "@/seo/registry";
import { buildPagePath, findAlternates } from "@/seo/metadata";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { listCaseStudies } from "@/lib/content/case-studies";

async function cmsOnlyEntries(base: string, existingPaths: Set<string>): Promise<MetadataRoute.Sitemap> {
  const client = createPublicSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client.from("content_pages").select("slug,page_type,robots,updated_at").eq("tenant_id", "all-things-fresh").eq("status", "published");
    if (error) return [];
    return (data ?? [])
      .filter((row) => typeof row.slug === "string" && row.slug.startsWith("/") && row.page_type !== "case-study" && !existingPaths.has(row.slug) && !String(row.robots || "").toLowerCase().includes("noindex"))
      .map((row) => ({
        url: `${base}${row.slug}`,
        lastModified: row.updated_at || undefined,
        changeFrequency: row.page_type === "article" || row.page_type === "guide" ? "monthly" as const : "weekly" as const,
        priority: row.page_type === "service" ? 0.9 : row.page_type === "location" ? 0.7 : 0.5,
      }));
  } catch {
    return [];
  }
}

/**
 * Single sitemap for now — well under the 50,000-URL point where Next's
 * sitemap-index support (`generateSitemaps`) becomes necessary. Only pages
 * that pass the quality gate (`getPublishedPages`) are listed; drafts never
 * appear here regardless of what's in the content files (Section 46/81).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenant = await getTenant();
  const base = tenant.seo.canonicalBase || "";

  const homeEntries: MetadataRoute.Sitemap = tenant.languages.enabled.map((locale) => ({
    url: `${base}${locale === "en" ? "/" : `/${locale}`}`,
    changeFrequency: "weekly",
    priority: 1,
  }));
  const hubEntries: MetadataRoute.Sitemap = [
    { url: `${base}/services`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/service-area`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/resources`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/book`, changeFrequency: "monthly", priority: 0.8 },
  ];

  const pages = getPublishedPages().filter((p) => !p.forceNoindex);
  const pageEntries: MetadataRoute.Sitemap = pages.map((page) => {
    const path = buildPagePath(page);
    // Reuses the exact same (ambiguity-aware) matching as page <head> hreflang
    // tags — see metadata.ts's findAlternates for why this can't be a naive
    // clusterId match (some clusters intentionally cover several same-locale
    // pricing tiers, e.g. Full Maintenance / Gold Premium / Masterpiece).
    const alternates = findAlternates(page).filter((p) => pages.includes(p));
    const languages = Object.fromEntries(
      [page, ...alternates].map((p) => [p.locale, `${base}${buildPagePath(p)}`]),
    );

    return {
      url: `${base}${path}`,
      lastModified: page.updatedAt || undefined,
      changeFrequency: page.type === "guide" ? "monthly" : "weekly",
      priority: page.type === "service" ? 0.9 : page.type === "location" ? 0.7 : 0.5,
      alternates: Object.keys(languages).length > 1 ? { languages } : undefined,
    };
  });

  const existingPaths = new Set(["/", "/services", "/service-area", "/resources", "/book", ...tenant.languages.enabled.filter((locale) => locale !== "en").map((locale) => `/${locale}`), ...pages.map(buildPagePath)]);
  const [cmsEntries, caseStudies] = await Promise.all([cmsOnlyEntries(base, existingPaths), listCaseStudies()]);
  const caseStudyEntries: MetadataRoute.Sitemap = caseStudies.length
    ? [
        { url: `${base}/our-work`, changeFrequency: "weekly", priority: 0.6 },
        ...caseStudies.map((study) => ({ url: `${base}/our-work/${study.slug}`, lastModified: study.updatedAt || undefined, changeFrequency: "monthly" as const, priority: 0.5 })),
      ]
    : [];
  return [...homeEntries, ...hubEntries, ...pageEntries, ...cmsEntries, ...caseStudyEntries];
}
