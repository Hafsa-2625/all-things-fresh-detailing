// Builds the homepage before/after photos in public/assets/compare/ from the originals in
// candidate-assets/before-after/ (2752x1536 JPEGs, ~3.5 MB each).
// usage: node scripts/optimize-compare-photos.mjs
//
// The widths must match COMPARE_WIDTHS in src/lib/locked-design/home-template.ts. sharp ships with
// Next.js, so there is nothing extra to install.
import { mkdir, stat } from "node:fs/promises";
import sharp from "sharp";

const WIDTHS = [640, 960, 1440, 1920, 2560];
const SOURCE = "candidate-assets/before-after";
const OUTPUT = "public/assets/compare";

await mkdir(OUTPUT, { recursive: true });
for (const name of ["before", "after"]) {
  for (const width of WIDTHS) {
    const file = `${OUTPUT}/${name}-${width}.webp`;
    // Metadata (EXIF, 300 dpi) is dropped; both photos are already sRGB.
    await sharp(`${SOURCE}/${name}.jpg`).resize({ width }).webp({ quality: 72, effort: 6, smartSubsample: true }).toFile(file);
    console.log(`${file}  ${Math.round((await stat(file)).size / 1024)} KB`);
  }
}
