import { expect, test } from "@playwright/test";
import { openStable, REFERENCE_VIEWPORT, VIEWPORTS } from "./support";

const CAR_FRAMES = [0, 4.25, 8.4] as const;

/**
 * Homepage regions (hero, services, booking, footer) and the dirty-to-clean car
 * transition pinned at three points of its 8.5 s cycle, per spec §6.
 */
for (const viewport of VIEWPORTS) {
  test.describe(`homepage ${viewport.name} ${viewport.width}px`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const seconds of CAR_FRAMES) {
      test(`hero with car transition at ${seconds}s`, async ({ page, baseURL }) => {
        await openStable(page, baseURL!, "/", seconds);
        await expect(page.locator("#top > section").first()).toHaveScreenshot([viewport.name, `hero-car-${seconds}s.png`]);
      });
    }

    test("services, booking and footer regions", async ({ page, baseURL }) => {
      await openStable(page, baseURL!, "/");
      await expect(page.locator("#services")).toHaveScreenshot([viewport.name, "services.png"]);
      await expect(page.locator("#book")).toHaveScreenshot([viewport.name, "booking.png"]);
      await expect(page.locator("footer")).toHaveScreenshot([viewport.name, "footer.png"]);
    });
  });
}

test.describe(`reference screenshot size ${REFERENCE_VIEWPORT.width}x${REFERENCE_VIEWPORT.height}`, () => {
  test.use({ viewport: { width: REFERENCE_VIEWPORT.width, height: REFERENCE_VIEWPORT.height } });

  test("homepage full page", async ({ page, baseURL }) => {
    await openStable(page, baseURL!, "/");
    await expect(page).toHaveScreenshot([REFERENCE_VIEWPORT.name, "home.png"], { fullPage: true, mask: [page.locator("iframe")] });
  });
});
