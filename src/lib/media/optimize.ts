import "server-only";

import sharp from "sharp";

/** Widest a template slot is ever drawn: the 1120px before/after box on a 2x screen, rounded up. */
export const SLOT_IMAGE_MAX_WIDTH = 2560;

/**
 * Re-encodes a photo bound to a template slot for the web, since those go straight onto public
 * pages: turned upright from its EXIF orientation, no wider than SLOT_IMAGE_MAX_WIDTH, metadata
 * stripped, WebP. A 3.5 MB phone JPEG comes out at a few hundred KB.
 */
export async function optimizeSlotImage(bytes: Buffer): Promise<{ bytes: Buffer; width: number; height: number }> {
  const { data, info } = await sharp(bytes)
    .rotate()
    .resize({ width: SLOT_IMAGE_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 75, effort: 5, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });
  return { bytes: data, width: info.width, height: info.height };
}
