import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { Locator, Page } from "@playwright/test";

const ROOT = join(__dirname, "..", "..");
const FONTS = join(__dirname, "..", "fixtures", "fonts");

export const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

/** Exact size of the client's approved design screenshot. */
export const REFERENCE_VIEWPORT = { name: "reference", width: 1536, height: 1024 } as const;

/** One page per locked template plus hubs, used for the region, geometry, style and CLS checks. */
export const TEMPLATE_PAGES = [
  "/",
  "/es",
  "/services",
  "/services/ceramic-coating",
  "/service-area",
  "/service-area/lakewood-oh",
  "/service-area/cleveland-oh/ceramic-coating",
  "/resources",
  "/resources/winter-car-care",
  "/our-work",
  "/book",
  "/faq",
] as const;

/** Every published public URL, from the SEO handoff inventory (indexable and noindex). */
export function publicPaths(): string[] {
  const rows = readFileSync(join(ROOT, "docs", "URL_INVENTORY.csv"), "utf8").trim().split("\n").slice(1);
  return rows.map((row) => new URL(row.split(",")[0]).pathname.replace(/\/$/, "") || "/");
}

export function slug(path: string): string {
  return path === "/" ? "home" : path.slice(1).replaceAll("/", "__");
}

/** 1×1 grey PNG standing in for YouTube poster thumbnails, which change without notice. */
const POSTER = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mNoaGgAAAMEAYFL09IQAAAAAElFTkSuQmCC", "base64");

const FILM_TITLE = "All Things Fresh detailing video";

/**
 * Third-party embeds, masked in page captures because their pixels cannot be pinned. The homepage
 * film player is scaled past its rounded box, so a mask on the iframe would also hide the page
 * around it; the box the video plays in is masked instead.
 */
export function thirdPartyEmbeds(page: Page): Locator[] {
  return [
    page.locator(`iframe:not([title="${FILM_TITLE}"])`),
    page.locator(`iframe[title="${FILM_TITLE}"]`).locator("xpath=.."),
  ];
}

/**
 * Makes a page deterministic without changing what it renders:
 * - timers and Date are frozen (review carousel stays on its first card);
 * - Google Fonts are served from tests/fixtures/fonts instead of the CDN;
 * - YouTube posters and the Google Maps embed are stubbed (the map is also masked);
 * - every other third-party request is refused so runs never depend on the network.
 */
export async function preparePage(page: Page, baseURL: string): Promise<void> {
  const ownHost = new URL(baseURL).host;
  const start = new Date("2026-09-15T12:00:00-04:00");
  await page.clock.install({ time: start });
  // An installed clock still ticks in real time; pausing it is what keeps the 5 s review
  // rotation from firing on slow captures. Time only moves through clock.runFor().
  await page.clock.pauseAt(new Date(start.getTime() + 1));
  await page.route("**/*", (route) => {
    const host = new URL(route.request().url()).host;
    return host === ownHost ? route.fallback() : route.abort("blockedbyclient");
  });
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css; charset=utf-8", body: readFileSync(join(FONTS, "google-fonts.css")) }));
  await page.route("https://fonts.gstatic.com/**", (route) =>
    route.fulfill({ contentType: "font/woff2", body: readFileSync(join(FONTS, basename(new URL(route.request().url()).pathname))) }));
  await page.route("https://i.ytimg.com/**", (route) => route.fulfill({ contentType: "image/png", body: POSTER }));
  await page.route(/^https:\/\/www\.google\.com\/maps/, (route) =>
    route.fulfill({ contentType: "text/html", body: "<!doctype html><title>map</title><body style=\"margin:0;background:#e8e8e8\"></body>" }));
}

/** Pins every running animation. The car transition is placed at `carSeconds`; everything else at frame 0. */
export async function pinAnimations(page: Page, carSeconds: number): Promise<void> {
  await page.evaluate((carMs) => {
    for (const animation of document.getAnimations()) {
      if (animation instanceof CSSTransition) {
        animation.finish();
        continue;
      }
      animation.pause();
      const name = animation instanceof CSSAnimation ? animation.animationName : "";
      animation.currentTime = name === "atf-detail-reveal" || name === "atf-detail-restore" ? carMs : 0;
    }
  }, carSeconds * 1000);
}

/** Opens a public page and waits until fonts, images and the design runtime have settled. */
export async function openStable(page: Page, baseURL: string, path: string, carSeconds = 0): Promise<void> {
  await preparePage(page, baseURL);
  await page.goto(path, { waitUntil: "networkidle" });
  // Lets the design runtime mount (it boots on timers) without reaching the 5 s review rotation.
  await page.clock.runFor(1500);
  await page.evaluate(async () => {
    // Lazy images would otherwise stay unloaded below the fold in a full-page capture.
    for (const image of Array.from(document.images)) image.loading = "eager";
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map((image) =>
      (image.complete ? Promise.resolve() : new Promise((resolve) => { image.addEventListener("load", resolve, { once: true }); image.addEventListener("error", resolve, { once: true }); }))
        .then(() => image.decode().catch(() => undefined))));
  });
  await page.waitForLoadState("networkidle");
  await pinAnimations(page, carSeconds);
}
