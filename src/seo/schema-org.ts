import type { TenantConfig } from "@/tenant/schema";
import type { SeoPage } from "./types";
import { buildPagePath } from "./metadata";

type JsonLd = Record<string, unknown>;

function absoluteUrl(tenant: TenantConfig, path: string): string {
  const base = tenant.seo.canonicalBase || "";
  return base ? `${base}${path}` : path;
}

export function localBusinessSchema(tenant: TenantConfig): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: tenant.brand.name,
    telephone: tenant.business.phone,
    areaServed: tenant.business.serviceCities.map((city) => ({ "@type": "City", name: city })),
    address: { "@type": "PostalAddress", addressRegion: "OH", addressCountry: "US" },
    openingHours: tenant.business.hours,
  };
}

export function serviceSchema(tenant: TenantConfig, page: SeoPage): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.h1,
    description: page.description,
    provider: { "@type": "LocalBusiness", name: tenant.brand.name, telephone: tenant.business.phone },
    areaServed: tenant.business.serviceArea,
  };
}

export function faqPageSchema(page: SeoPage): JsonLd | null {
  if (!page.faq || page.faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function articleSchema(page: SeoPage): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.h1,
    description: page.description,
    inLanguage: page.locale,
  };
}

export function breadcrumbSchema(tenant: TenantConfig, crumbs: { label: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: absoluteUrl(tenant, c.path),
    })),
  };
}

/** Assembles every schema block a page declares in `page.schema`, ready to serialize. */
export function buildPageSchema(tenant: TenantConfig, page: SeoPage, crumbs: { label: string; path: string }[]): JsonLd[] {
  const blocks: JsonLd[] = [];
  for (const kind of page.schema) {
    if (kind === "LocalBusiness") blocks.push(localBusinessSchema(tenant));
    if (kind === "Service") blocks.push(serviceSchema(tenant, page));
    if (kind === "FAQPage") {
      const faq = faqPageSchema(page);
      if (faq) blocks.push(faq);
    }
    if (kind === "Article") blocks.push(articleSchema(page));
    if (kind === "BreadcrumbList") blocks.push(breadcrumbSchema(tenant, crumbs));
  }
  return blocks;
}

export { buildPagePath };
