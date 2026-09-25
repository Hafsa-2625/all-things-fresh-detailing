/** Generates the exact numbers used in docs/FINAL_SEO_REPORT.md. */
import { allSeoPages, isActuallyPublishable } from "../src/seo/registry";
import { keywordClusters } from "../src/seo/keyword-registry";
import type { SeoPageType, SearchIntent } from "../src/seo/types";

const published = allSeoPages.filter(isActuallyPublishable);
const noindexed = published.filter((p) => p.forceNoindex);
const indexable = published.filter((p) => !p.forceNoindex);

function byLocale(locale: "en" | "es") {
  return indexable.filter((p) => p.locale === locale);
}

const TYPES: SeoPageType[] = ["service", "location", "location_service", "project", "guide", "faq", "static"];

console.log("### Indexable (published AND not forceNoindex)");
console.log("total:", indexable.length, "| en:", byLocale("en").length, "| es:", byLocale("es").length);
console.log("published-but-noindexed:", noindexed.length, "(", noindexed.map((p) => `${p.locale}/${p.slug}`).join(", "), ")");
console.log("draft (route not generated):", allSeoPages.length - published.length);
console.log("total modeled:", allSeoPages.length);

console.log("\n### Indexable by type (en / es)");
for (const t of TYPES) {
  const en = byLocale("en").filter((p) => p.type === t).length;
  const es = byLocale("es").filter((p) => p.type === t).length;
  console.log(`${t}: ${en + es} (en ${en} / es ${es})`);
}

console.log("\n### Location vs non-location (indexable)");
const locationTypes: SeoPageType[] = ["location", "location_service"];
const loc = indexable.filter((p) => locationTypes.includes(p.type)).length;
const nonLoc = indexable.length - loc;
console.log(`non-location: ${nonLoc} (${Math.round((nonLoc / indexable.length) * 100)}%)`);
console.log(`location:     ${loc} (${Math.round((loc / indexable.length) * 100)}%)`);

console.log("\n### Keywords");
let nonLocKw = 0, locTemplateKw = 0;
for (const c of keywordClusters) {
  for (const k of c.keywords) {
    if (k.locationBound) locTemplateKw++;
    else nonLocKw++;
  }
}
const CITIES = 7;
console.log("clusters:", keywordClusters.length, `(non-location ${keywordClusters.filter((c) => !c.locationBound).length}, location ${keywordClusters.filter((c) => c.locationBound).length})`);
console.log("template keyword entries:", nonLocKw + locTemplateKw);
console.log(`expanded phrases: ${nonLocKw} non-location + ${locTemplateKw} templates x ${CITIES} cities = ${nonLocKw + locTemplateKw * CITIES}`);

console.log("\n### Intent coverage (indexable pages)");
const intents: SearchIntent[] = ["commercial", "transactional", "informational", "comparison", "problem_solution", "navigational"];
for (const i of intents) {
  console.log(`${i}: ${indexable.filter((p) => p.intent.includes(i)).length}`);
}

console.log("\n### Schema types in use");
const schemas = new Map<string, number>();
for (const p of indexable) for (const s of p.schema) schemas.set(s, (schemas.get(s) ?? 0) + 1);
for (const [k, v] of [...schemas].sort((a, b) => b[1] - a[1])) console.log(`${k}: ${v}`);

console.log("\n### Keyword cannibalization check (same primary keyword, same locale)");
const seen = new Map<string, string[]>();
for (const p of indexable) {
  const key = `${p.locale}::${p.primaryKeyword.toLowerCase()}`;
  seen.set(key, [...(seen.get(key) ?? []), p.slug]);
}
const dupes = [...seen].filter(([, v]) => v.length > 1);
console.log(dupes.length === 0 ? "none" : dupes.map(([k, v]) => `${k} -> ${v.join(", ")}`).join("\n"));
