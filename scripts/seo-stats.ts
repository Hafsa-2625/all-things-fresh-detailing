import { allSeoPages, isActuallyPublishable, getAllPagesWithGateStatus, registryStats } from "../src/seo/registry";
import { locationServicePages } from "../src/seo/content/location-service";
import { keywordStats } from "../src/seo/keyword-registry";

console.log("=== registryStats ===");
console.log(registryStats());

console.log("\n=== location-service pages ===");
console.log(locationServicePages.length);

console.log("\n=== keywordStats ===");
console.log(keywordStats());

console.log("\n=== failing published-intent pages (status published but gate rejects) ===");
for (const { page, gate } of getAllPagesWithGateStatus()) {
  if (page.status === "published" && !gate.publishable) {
    console.log(`${page.type}/${page.locale}/${page.slug}:`, gate.reasons);
  }
}

console.log("\n=== total pages:", allSeoPages.length, "| actually publishable:", allSeoPages.filter(isActuallyPublishable).length, "===");
