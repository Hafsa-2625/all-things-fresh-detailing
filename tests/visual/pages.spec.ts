import { expect, test } from "@playwright/test";
import { openStable, publicPaths, slug, thirdPartyEmbeds, VIEWPORTS } from "./support";

/** Full-page baseline of every published public URL at mobile, tablet and desktop widths. */
for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} ${viewport.width}px`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const path of publicPaths()) {
      test(path, async ({ page, baseURL }) => {
        await openStable(page, baseURL!, path);
        await expect(page).toHaveScreenshot([viewport.name, `${slug(path)}.png`], {
          fullPage: true,
          // Google Maps and the homepage video are genuinely dynamic third-party content; the map's
          // box is asserted in geometry.spec.ts, and a masked box still has to sit where it did.
          mask: thirdPartyEmbeds(page),
        });
      });
    }
  });
}
