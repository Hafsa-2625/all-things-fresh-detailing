import { expect, test } from "@playwright/test";
import { openStable, slug, TEMPLATE_PAGES, VIEWPORTS } from "./support";

/**
 * Bounding boxes of the structural elements the spec names (hero panel, nav pill,
 * card grids, booking form, footer, map container). A change that happens to pass
 * the pixel comparison still fails here if geometry moved by half a pixel or more.
 */
for (const viewport of VIEWPORTS) {
  test.describe(`geometry ${viewport.name} ${viewport.width}px`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const path of TEMPLATE_PAGES) {
      test(path, async ({ page, baseURL }) => {
        await openStable(page, baseURL!, path);
        const boxes = await page.evaluate(() => {
          const round = (value: number) => Math.round(value * 2) / 2;
          const box = (element: Element | null | undefined) => {
            if (!element) return null;
            const rect = element.getBoundingClientRect();
            return { x: round(rect.left + window.scrollX), y: round(rect.top + window.scrollY), width: round(rect.width), height: round(rect.height) };
          };
          const all = (selector: string) => Array.from(document.querySelectorAll(selector)).map(box);
          return {
            document: { width: document.documentElement.scrollWidth, height: round(document.documentElement.scrollHeight) },
            heroPanel: box(document.querySelector("#top > section > div")),
            navPill: box(document.querySelector("#top header nav")),
            cardGrids: all('#top div[style*="grid-template-columns: repeat(3"], #top div[style*="grid-template-columns: repeat(4"], #top div[style*="grid-template-columns:repeat(3"]'),
            bookingForm: box(document.querySelector("#book form")),
            footer: box(document.querySelector("footer")),
            mapContainer: box(document.querySelector('iframe[src*="google.com/maps"]')?.parentElement),
            sections: all("#top > section"),
          };
        });
        expect(boxes.document.width, "page must not scroll horizontally").toBeLessThanOrEqual(viewport.width);
        expect(JSON.stringify(boxes, null, 2)).toMatchSnapshot([viewport.name, `${slug(path)}.json`]);
      });
    }
  });
}
