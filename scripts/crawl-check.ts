/**
 * Production-style route crawl against a running server. It validates every
 * URL in sitemap.xml plus the conversion hubs that intentionally sit outside
 * the SEO registry. Clean canonical paths are tested, not internal /en paths.
 */
export {};

const BASE = (process.env.CRAWL_BASE || "http://localhost:3000").replace(/\/$/, "");

const EXTRA_PATHS = [
  "/", "/services", "/service-area", "/resources", "/our-work",
  "/book", "/reviews", "/faq", "/contact", "/about", "/gift-cards",
];

function localPath(value: string): string {
  try { return new URL(value, BASE).pathname; } catch { return value.startsWith("/") ? value : `/${value}`; }
}

async function main() {
  const sitemapResponse = await fetch(`${BASE}/sitemap.xml`);
  if (!sitemapResponse.ok) throw new Error(`sitemap.xml returned ${sitemapResponse.status}`);
  const sitemap = await sitemapResponse.text();
  const sitemapPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => localPath(match[1]));
  const queue = [...new Set([...EXTRA_PATHS, ...sitemapPaths])];
  const broken: { path: string; status: number; detail: string }[] = [];
  const qualityProblems: string[] = [];

  for (const path of queue) {
    let response: Response;
    try {
      response = await fetch(`${BASE}${path}`, { redirect: "follow", headers: { "accept-language": "en-US,en;q=0.9" } });
    } catch (error) {
      broken.push({ path, status: 0, detail: String(error) });
      continue;
    }
    if (!response.ok) {
      broken.push({ path, status: response.status, detail: "request failed" });
      continue;
    }
    const type = response.headers.get("content-type") || "";
    if (type.includes("text/html")) {
      const html = await response.text();
      if (!/<title>[^<]+<\/title>/i.test(html)) qualityProblems.push(`${path}: missing title`);
      if (!/name="description" content="[^"]+"/i.test(html)) qualityProblems.push(`${path}: missing description`);
      if (!/rel="canonical" href="[^"]+"/i.test(html)) qualityProblems.push(`${path}: missing canonical`);
      if (/Drop a photo|browse files/i.test(html)) qualityProblems.push(`${path}: visible media placeholder`);
    }
  }

  console.log(`Checked ${queue.length} public URLs (${sitemapPaths.length} from sitemap).`);
  if (broken.length) {
    console.log(`\n${broken.length} broken URLs:`);
    for (const item of broken) console.log(`  ${item.status} ${item.path} — ${item.detail}`);
  }
  if (qualityProblems.length) {
    console.log(`\n${qualityProblems.length} metadata/media problems:`);
    for (const item of qualityProblems) console.log(`  ${item}`);
  }
  if (!broken.length && !qualityProblems.length) console.log("All public URLs returned successfully with required metadata and filled media.");
  if (broken.length || qualityProblems.length) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
