import type { SeoPage } from "@/seo/types";
import { getLockedSubpageMarkup, type LockedTemplate } from "@/lib/locked-design/subpage-template";
import { DcRuntime } from "./dc-runtime";
import { getTenant } from "@/tenant/get-tenant";
import { getPageCatalog } from "@/lib/content/catalog";
import type { CaseStudy } from "@/lib/content/case-studies";

export async function LockedSubpage({ page, template, caseStudy }: { page: SeoPage; template: LockedTemplate; caseStudy?: CaseStudy }) {
  const [tenant, catalog] = await Promise.all([
    getTenant(),
    // Service × location pages carry both slugs; plain service and location pages use their own.
    getPageCatalog({
      serviceSlug: template === "service" ? (page.serviceSlug ?? page.slug) : undefined,
      locationSlug: template === "location" ? (page.locationSlug ?? page.slug) : undefined,
    }),
  ]);
  return (
    <>
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: getLockedSubpageMarkup(page, template, tenant, true, catalog, caseStudy) }} />
      <DcRuntime />
    </>
  );
}
