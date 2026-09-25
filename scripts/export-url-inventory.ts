import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { allSeoPages, isActuallyPublishable } from "../src/seo/registry";
import { buildPagePath } from "../src/seo/metadata";
import type { SeoPage } from "../src/seo/types";

const canonicalBase = "https://www.allthingsfreshcardetailing.com";
const docsDirectory = join(process.cwd(), "docs");

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]);
  return [
    columns.map(csvCell).join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ].join("\r\n") + "\r\n";
}

function pageRow(page: SeoPage) {
  const path = buildPagePath(page);
  const publishable = isActuallyPublishable(page);
  const indexable = publishable && !page.forceNoindex;

  return {
    canonical_url: `${canonicalBase}${path}`,
    internal_route: path,
    locale: page.locale,
    page_type: page.type,
    status: indexable ? "indexable" : publishable ? "published_noindex" : "draft_not_routed",
    title: page.title,
    h1: page.h1,
    primary_keyword: page.primaryKeyword,
    secondary_keywords: page.secondaryKeywords.join(" | "),
    topic_cluster: page.clusterId,
    search_intent: page.intent.join(" | "),
    schema: page.schema.join(" | "),
  };
}

const homeRows = [
  {
    canonical_url: `${canonicalBase}/`,
    internal_route: "/",
    locale: "en",
    page_type: "home",
    status: "indexable",
    title: "All Things Fresh Mobile Car Detailing",
    h1: "All Things Fresh",
    primary_keyword: "mobile car detailing Cleveland",
    secondary_keywords: "mobile detailing Greater Cleveland | car detailing Cleveland",
    topic_cluster: "mobile-detailing",
    search_intent: "commercial | navigational",
    schema: "LocalBusiness | WebSite",
  },
  {
    canonical_url: `${canonicalBase}/es`,
    internal_route: "/es",
    locale: "es",
    page_type: "home",
    status: "indexable",
    title: "All Things Fresh Detailing Móvil",
    h1: "All Things Fresh",
    primary_keyword: "detailing móvil de autos Cleveland",
    secondary_keywords: "lavado de auto a domicilio Cleveland",
    topic_cluster: "mobile-detailing",
    search_intent: "commercial | navigational",
    schema: "LocalBusiness | WebSite",
  },
  {
    canonical_url: `${canonicalBase}/services`, internal_route: "/services", locale: "en", page_type: "hub", status: "indexable",
    title: "Mobile Car Detailing Services", h1: "Detailing services, built around your vehicle.", primary_keyword: "mobile car detailing services", secondary_keywords: "", topic_cluster: "mobile-detailing", search_intent: "commercial", schema: "ItemList | BreadcrumbList",
  },
  {
    canonical_url: `${canonicalBase}/service-area`, internal_route: "/service-area", locale: "en", page_type: "hub", status: "indexable",
    title: "Mobile Detailing Service Areas", h1: "Mobile detailing across Greater Cleveland.", primary_keyword: "mobile detailing Greater Cleveland", secondary_keywords: "", topic_cluster: "detailing-near-me", search_intent: "commercial | navigational", schema: "ItemList | BreadcrumbList",
  },
  {
    canonical_url: `${canonicalBase}/resources`, internal_route: "/resources", locale: "en", page_type: "hub", status: "indexable",
    title: "Car Care Resources", h1: "Straight answers for a cleaner, better-protected car.", primary_keyword: "car care resources", secondary_keywords: "", topic_cluster: "resources", search_intent: "informational", schema: "CollectionPage | BreadcrumbList",
  },
  {
    canonical_url: `${canonicalBase}/book`, internal_route: "/book", locale: "en", page_type: "conversion", status: "indexable",
    title: "Book Mobile Car Detailing", h1: "Book your mobile detail.", primary_keyword: "book mobile car detailing", secondary_keywords: "", topic_cluster: "mobile-detailing", search_intent: "transactional", schema: "WebPage | BreadcrumbList",
  },
  {
    canonical_url: `${canonicalBase}/reviews`, internal_route: "/reviews", locale: "en", page_type: "hub", status: "published_noindex",
    title: "Customer Reviews", h1: "What customers say after the detail.", primary_keyword: "car detailing reviews", secondary_keywords: "", topic_cluster: "reviews", search_intent: "commercial", schema: "WebPage",
  },
  {
    canonical_url: `${canonicalBase}/our-work`, internal_route: "/our-work", locale: "en", page_type: "hub", status: "published_noindex",
    title: "Our Detailing Work", h1: "Real vehicles. Real before and after.", primary_keyword: "car detailing before and after", secondary_keywords: "", topic_cluster: "case-studies", search_intent: "commercial | informational", schema: "CollectionPage",
  },
];

const publicRows = allSeoPages
  .filter((page) => isActuallyPublishable(page))
  .map(pageRow)
  .sort((a, b) => a.internal_route.localeCompare(b.internal_route));

const backlogRows = allSeoPages
  .filter((page) => !isActuallyPublishable(page))
  .map(pageRow)
  .sort((a, b) => a.internal_route.localeCompare(b.internal_route));

async function main() {
  await mkdir(docsDirectory, { recursive: true });
  await Promise.all([
    writeFile(join(docsDirectory, "URL_INVENTORY.csv"), toCsv([...homeRows, ...publicRows]), "utf8"),
    writeFile(join(docsDirectory, "CONTENT_BACKLOG.csv"), toCsv(backlogRows), "utf8"),
  ]);

  const indexableCount = [...homeRows, ...publicRows].filter((row) => row.status === "indexable").length;
  const noindexCount = [...homeRows, ...publicRows].filter((row) => row.status === "published_noindex").length;
  console.log(`Exported ${indexableCount} indexable URLs, ${noindexCount} published noindex URLs, and ${backlogRows.length} draft opportunities.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
