import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Browser-injected QA harness — plain script, not app code. Runs inside
    // the page via the design-QA tooling; see docs/FINAL_DESIGN_QA.md.
    "public/audit.js",
    // Approved Design Component runtime files are vendor artifacts copied
    // verbatim from the locked visual source.
    "public/support.js",
    "public/image-slot.js",
    "scripts/visual-audit.js",
    // Node bootstrap shims use CommonJS intentionally so they run before tsx.
    "scripts/*.cjs",
  ]),
]);

export default eslintConfig;
