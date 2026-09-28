// Builds the homepage TikTok feed images in public/assets/tiktok/ from the originals in
// candidate-assets/tiktok/ (1066-1120px wide PNG screenshots of 1.2-3.5 MB, and a 468px avatar).
// usage: node scripts/optimize-tiktok-assets.mjs
//
// Cards are at most 340px wide (4:5, cover), so 720px covers a 2x screen. The avatar is drawn at
// 64px at most. sharp ships with Next.js, so there is nothing extra to install.
import { mkdir, stat } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "candidate-assets/tiktok";
const OUTPUT = "public/assets/tiktok";
// Same as the card background, in case a screenshot has transparent pixels.
const CARD = "#121212";

async function write(input, file, width) {
  await sharp(`${SOURCE}/${input}`).resize({ width }).flatten({ background: CARD }).webp({ quality: 74, effort: 6, smartSubsample: true }).toFile(file);
  console.log(`${file}  ${Math.round((await stat(file)).size / 1024)} KB`);
}

await mkdir(OUTPUT, { recursive: true });
await write("avatar.jpg", `${OUTPUT}/avatar.webp`, 150);
for (let n = 1; n <= 6; n++) await write(`post-0${n}.png`, `${OUTPUT}/post-0${n}.webp`, 720);
