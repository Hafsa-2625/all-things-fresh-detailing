import type { SeoPage } from "./types";

export interface QualityGateResult {
  publishable: boolean;
  reasons: string[];
}

/**
 * Automated version of Section 46's index requirements: unique title/H1/
 * meta/intro, real context (a non-trivial intro + at least one internal
 * link), a primary keyword, and — critically — an explicit `status:
 * "published"` from the author. A page can declare itself published and
 * still fail this gate; `registry.ts` treats the gate as authoritative, not
 * the declared status, so nobody can accidentally ship a thin page by
 * skipping a checklist.
 */
export function runQualityGate(page: SeoPage, allPages: SeoPage[] = []): QualityGateResult {
  const reasons: string[] = [];

  if (page.status === "draft") {
    reasons.push(page.draftReason ?? "Marked draft.");
    return { publishable: false, reasons };
  }

  if (!page.title || page.title.length < 6) reasons.push("Missing or too-short title.");
  if (!page.h1 || page.h1.length < 6) reasons.push("Missing or too-short H1.");
  if (!page.description || page.description.length < 40) reasons.push("Meta description missing or under 40 characters.");
  if (!page.intro || page.intro.split(" ").length < 15) reasons.push("Intro is missing or too thin (under ~15 words).");
  if (!page.primaryKeyword) reasons.push("No primary keyword assigned.");
  const exemptFromInternalLinks = page.type === "faq" || page.type === "static";
  if (page.relatedSlugs.length === 0 && !exemptFromInternalLinks) reasons.push("No internal links out — orphan page risk.");

  if (allPages.length > 0) {
    const dupeTitle = allPages.find((p) => p !== page && p.locale === page.locale && p.title === page.title);
    if (dupeTitle) reasons.push(`Duplicate title with "${dupeTitle.slug}".`);
    const dupeDesc = allPages.find((p) => p !== page && p.locale === page.locale && p.description === page.description);
    if (dupeDesc) reasons.push(`Duplicate meta description with "${dupeDesc.slug}".`);
  }

  return { publishable: reasons.length === 0, reasons };
}
