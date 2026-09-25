import { defineConfig } from "@playwright/test";

/**
 * Visual-regression gate for the frozen public design (CLAUDE.md, ATF Backend Spec §6).
 *
 * Baselines are Linux renders from the pinned Playwright image, so compare only in
 * that image: `npm run test:visual:docker` locally (against a server on the host),
 * or the CI "visual" job. A macOS run looks for *-darwin.png baselines and fails.
 *
 * The server must be a production build WITHOUT Supabase settings so pages render
 * from versioned content (see the `test:visual:*` scripts in package.json).
 */
const externalBase = process.env.VISUAL_BASE_URL;
const port = Number(process.env.VISUAL_PORT || 3200);

export default defineConfig({
  testDir: "tests",
  timeout: 90_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  snapshotPathTemplate: "{testDir}/__baselines__/{testFileName}/{arg}-{platform}{ext}",
  expect: {
    // Zero tolerance: any changed pixel fails. Playwright's comparator already ignores
    // anti-aliasing pixels, which is the spec's 1px anti-aliasing allowance.
    toHaveScreenshot: { threshold: 0, maxDiffPixels: 0, animations: "allow", caret: "hide", scale: "css" },
  },
  use: {
    baseURL: externalBase || `http://localhost:${port}`,
    browserName: "chromium",
    // PLAYWRIGHT_CHANNEL=chrome runs the specs against a locally installed Chrome for debugging.
    // Baselines are only valid from the bundled Chromium in the pinned Linux image.
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    deviceScaleFactor: 1,
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "America/New_York",
  },
  projects: [{ name: "visual", testDir: "tests/visual" }],
  webServer: externalBase
    ? undefined
    : {
        command: `npx next start -p ${port}`,
        url: `http://localhost:${port}/admin/login`,
        reuseExistingServer: !process.env.CI,
        env: { NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "" },
      },
});
