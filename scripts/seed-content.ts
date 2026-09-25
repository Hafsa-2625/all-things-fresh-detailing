import { createClient } from "@supabase/supabase-js";
import { getPublishedPages } from "../src/seo/registry";
import { buildPagePath } from "../src/seo/metadata";
import { allThingsFreshTenant } from "../src/tenant/tenants/all-things-fresh";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const rows = getPublishedPages().map((page) => ({
  tenant_id: "all-things-fresh",
  title: page.title,
  slug: buildPagePath(page),
  page_type: page.type,
  status: "published",
  eyebrow: page.primaryKeyword,
  heading: page.h1,
  intro: page.intro,
  sections: page.sections,
  seo_title: page.title,
  seo_description: page.description,
  canonical_url: `https://www.allthingsfreshcardetailing.com${buildPagePath(page)}`,
  robots: page.forceNoindex ? "noindex,follow" : "index,follow",
  schema_json: { types: page.schema },
}));

const published = getPublishedPages();
const serviceRows = allThingsFreshTenant.services.map((service) => {
  const page = published.find((candidate) => candidate.type === "service" && candidate.locale === "en" && candidate.slug === service.slug);
  return {
    tenant_id: "all-things-fresh",
    name: service.name,
    slug: service.slug,
    short_blurb: service.blurb,
    long_body: page?.sections.map((section) => [section.heading, section.body].filter(Boolean).join(": ")).join("\n\n") || null,
    price_from: service.price ?? null,
    status: "published",
    seo_title: page?.title || service.name,
    seo_description: page?.description || service.blurb,
    media_path: service.media?.src || null,
  };
});
const locationRows = published.filter((page) => page.type === "location" && page.locale === "en").map((page) => ({
  tenant_id: "all-things-fresh",
  city: page.h1.replace(/^Mobile (Car )?Detailing in /i, "").replace(/,? OH$/i, ""),
  state: "OH",
  slug: page.slug,
  local_intro: page.intro,
  neighborhoods: [],
  status: "published",
  seo_title: page.title,
  seo_description: page.description,
}));
const articleRows = published.filter((page) => page.type === "guide").map((page) => ({
  tenant_id: "all-things-fresh",
  title: page.title,
  slug: page.slug,
  category: page.clusterId,
  lede: page.intro,
  body: page.sections,
  status: "published",
  seo_title: page.title,
  seo_description: page.description,
}));

async function main() {
  const results = await Promise.all([
    supabase.from("content_pages").upsert(rows, { onConflict: "tenant_id,slug" }),
    supabase.from("services").upsert(serviceRows, { onConflict: "tenant_id,slug" }),
    supabase.from("locations").upsert(locationRows, { onConflict: "tenant_id,slug" }),
    supabase.from("articles").upsert(articleRows, { onConflict: "tenant_id,slug" }),
  ]);
  for (const result of results) if (result.error) throw result.error;
  console.log(`Seeded ${rows.length} public pages, ${serviceRows.length} services, ${locationRows.length} locations, and ${articleRows.length} resources.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
