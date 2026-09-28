import { expect, test } from "@playwright/test";
import { openStable } from "./support";

/**
 * Computed-style contract from ATF Backend Spec §2 ("the only values that may appear on
 * a public page"), checked on the rendered pages at desktop width. Heading sizes are the
 * approved clamp() values resolved at 1440px. clamp(43px, 5vw, 68px) is used by the
 * approved build but missing from the spec's table, so it is accepted here.
 */
const HEADING_CLAMPS: [number, number, number][] = [[39, 4.5, 62], [43, 5, 68], [44, 5, 70], [53, 7, 92]];
const px = (value: string) => Number.parseFloat(value);

test.use({ viewport: { width: 1440, height: 900 } });

test("homepage type and colour tokens", async ({ page, baseURL }) => {
  await openStable(page, baseURL!, "/");
  const width = 1440;
  const facts = await page.evaluate(() => {
    const style = (element: Element | null) => (element ? getComputedStyle(element) : null);
    const pick = (element: Element | null, keys: string[]) => {
      const computed = style(element);
      return computed ? Object.fromEntries(keys.map((key) => [key, computed.getPropertyValue(key)])) : null;
    };
    const all = (selector: string) => Array.from(document.querySelectorAll(selector));
    const anyColor = (property: "color" | "background-color" | "fill" | "stroke", value: string) =>
      all("#top *").some((element) => getComputedStyle(element).getPropertyValue(property) === value);
    return {
      body: pick(document.body, ["font-family"]),
      wordmark: pick(document.querySelector("#top > section h1"), ["font-family", "font-weight", "color"]),
      headings: all("#top h2").map((element) => pick(element, ["font-size", "font-weight", "line-height", "letter-spacing"])),
      // Selected by computed style: the design runtime re-serialises inline styles (hex becomes rgb).
      eyebrows: all("#top *")
        .filter((element) => {
          const computed = getComputedStyle(element);
          return computed.fontSize === "10px" && computed.textTransform === "uppercase" && computed.color === "rgb(146, 146, 146)";
        })
        .map((element) => pick(element, ["font-size", "font-weight", "letter-spacing", "color", "text-transform"])),
      services: pick(document.querySelector("#services"), ["background-color", "color"]),
      tints: all("#area, #book").map((element) => pick(element, ["background-color"])),
      nav: pick(document.querySelector("#top header nav"), ["background-color"]),
      navActive: pick(document.querySelector("#top header nav a"), ["background-color", "color"]),
      // Every link but the active Home pill (the nav's first child is the mobile menu toggle).
      navLinks: all("#top header nav a:not(:first-of-type)").map((element) => pick(element, ["color"])),
      containers: all('#top [style*="width: min(100%, 1120px)"]').map((element) => element.getBoundingClientRect().width),
      reviewSurface: anyColor("background-color", "rgb(244, 244, 244)"),
      stars: anyColor("color", "rgb(245, 166, 35)") || anyColor("fill", "rgb(245, 166, 35)"),
      // At rest the accent appears in the featured service card gradient; elsewhere it is a hover or success state.
      accentFill: all("#top *").some((element) => getComputedStyle(element).backgroundImage.includes("rgb(217, 245, 255)")),
      // The check icons are drawn with an SVG stroke.
      accentCheck: anyColor("stroke", "rgb(39, 174, 233)") || anyColor("color", "rgb(39, 174, 233)") || anyColor("fill", "rgb(39, 174, 233)"),
    };
  });

  expect(facts.body?.["font-family"]).toBe("Arial, Helvetica, sans-serif");
  expect(facts.wordmark?.["font-family"]).toMatch(/^"Alex Brush", "Great Vibes", cursive$/);
  expect(facts.wordmark?.["font-weight"]).toBe("400");
  expect(facts.wordmark?.color).toBe("rgb(50, 104, 181)");

  const allowedSizes = HEADING_CLAMPS.map(([min, vw, max]) => Math.min(max, Math.max(min, (vw * width) / 100)));
  expect(facts.headings.length).toBeGreaterThan(3);
  for (const heading of facts.headings) {
    const size = px(heading!["font-size"]);
    expect(allowedSizes, `h2 size ${size}px is not an approved heading token`).toContain(size);
    expect(heading!["font-weight"]).toBe("700");
    expect(px(heading!["line-height"])).toBeCloseTo(size * 0.92, 1);
    expect(px(heading!["letter-spacing"])).toBeCloseTo(size * -0.085, 1);
  }

  expect(facts.eyebrows.length).toBeGreaterThan(2);
  for (const eyebrow of facts.eyebrows) {
    expect(eyebrow).toMatchObject({ "font-size": "10px", "font-weight": "700", color: "rgb(146, 146, 146)", "text-transform": "uppercase" });
    expect([1.2, 1.4]).toContain(Math.round(px(eyebrow!["letter-spacing"]) * 10) / 10);
  }

  expect(facts.services?.["background-color"]).toBe("rgb(5, 5, 5)");
  for (const tint of facts.tints) expect(tint?.["background-color"]).toBe("rgb(250, 250, 250)");
  expect(facts.nav?.["background-color"]).toBe("rgb(255, 254, 252)");
  expect(facts.navActive).toMatchObject({ "background-color": "rgb(44, 48, 51)", color: "rgb(255, 255, 255)" });
  for (const link of facts.navLinks) expect(link?.color).toBe("rgb(74, 69, 64)");
  expect(facts.containers.length).toBeGreaterThan(3);
  for (const containerWidth of facts.containers) expect(containerWidth).toBeLessThanOrEqual(1120);
  expect(facts.reviewSurface, "review surface #f4f4f4").toBe(true);
  expect(facts.stars, "review stars #f5a623").toBe(true);
  expect(facts.accentFill, "accent fill #d9f5ff").toBe(true);
  expect(facts.accentCheck, "accent check icon #27aee9").toBe(true);
});

test("subpage template keeps the nav and heading tokens", async ({ page, baseURL }) => {
  await openStable(page, baseURL!, "/services/ceramic-coating");
  const facts = await page.evaluate(() => {
    const computed = (selector: string) => {
      const element = document.querySelector(selector);
      return element ? getComputedStyle(element) : null;
    };
    const h1 = computed("#top h1");
    return {
      body: getComputedStyle(document.body).fontFamily,
      nav: computed("#top header nav")?.backgroundColor,
      h1: h1 ? { size: h1.fontSize, weight: h1.fontWeight, lineHeight: h1.lineHeight, letterSpacing: h1.letterSpacing } : null,
    };
  });
  expect(facts.body).toBe("Arial, Helvetica, sans-serif");
  expect(facts.nav).toBe("rgb(255, 254, 252)");
  // Subpage titles use the approved section-heading token (spec §7.2).
  const size = px(facts.h1!.size);
  expect(size).toBe(62);
  expect(facts.h1!.weight).toBe("700");
  expect(px(facts.h1!.letterSpacing)).toBeCloseTo(size * -0.085, 1);
});
