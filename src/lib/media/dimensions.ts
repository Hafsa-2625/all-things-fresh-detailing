/**
 * Pixel dimensions straight from the file header, for PNG, JPEG and WebP. No dependency and no
 * decoding: the admin needs the size to warn about small uploads and to store width/height, which
 * were previously always null.
 *
 * Returns null for formats this does not parse (AVIF, video) — the upload still succeeds, it just
 * has no recorded size.
 */
export interface ImageDimensions { width: number; height: number }

function png(bytes: Buffer): ImageDimensions | null {
  if (bytes.length < 24 || bytes.toString("latin1", 1, 4) !== "PNG") return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function jpeg(bytes: Buffer): ImageDimensions | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    // SOF0-SOF15, excluding the non-frame markers DHT (c4), JPG (c8) and DAC (cc).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

function webp(bytes: Buffer): ImageDimensions | null {
  if (bytes.length < 30 || bytes.toString("latin1", 0, 4) !== "RIFF" || bytes.toString("latin1", 8, 12) !== "WEBP") return null;
  const format = bytes.toString("latin1", 12, 16);
  if (format === "VP8X") return { width: (bytes.readUIntLE(24, 3) & 0xffffff) + 1, height: (bytes.readUIntLE(27, 3) & 0xffffff) + 1 };
  if (format === "VP8 ") return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  if (format === "VP8L") {
    const bits = bytes.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

export function imageDimensions(bytes: Buffer, mimeType: string): ImageDimensions | null {
  const result = mimeType === "image/png" ? png(bytes)
    : mimeType === "image/jpeg" ? jpeg(bytes)
      : mimeType === "image/webp" ? webp(bytes)
        : null;
  return result && result.width > 0 && result.height > 0 ? result : null;
}
