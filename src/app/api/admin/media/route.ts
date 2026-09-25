import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { canWrite, getStaffProfile } from "@/lib/admin/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { deleteRecord, findRecord, insertRecord, listRecords } from "@/lib/operations/store";
import { findMediaSlot } from "@/lib/content/media-slots";
import { imageDimensions } from "@/lib/media/dimensions";

const MAX_BYTES = 12 * 1024 * 1024;
/** Created by supabase/migrations/0003_security_hardening.sql. */
const BUCKET = "atf-media";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "all-things-fresh";

/**
 * File types are decided from the bytes, never from the browser-supplied name
 * or MIME type. SVG is deliberately unsupported: it can carry script and the
 * bucket is publicly readable.
 */
const SIGNATURES: Array<{ type: string; extension: string; matches: (bytes: Buffer) => boolean }> = [
  { type: "image/jpeg", extension: "jpg", matches: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/png", extension: "png", matches: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { type: "image/webp", extension: "webp", matches: (b) => b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP" },
  { type: "image/avif", extension: "avif", matches: (b) => b.toString("latin1", 4, 8) === "ftyp" && ["avif", "avis"].includes(b.toString("latin1", 8, 12)) },
  { type: "video/webm", extension: "webm", matches: (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
  { type: "video/mp4", extension: "mp4", matches: (b) => b.toString("latin1", 4, 8) === "ftyp" && !["avif", "avis", "qt  "].includes(b.toString("latin1", 8, 12)) },
];

function safeBaseName(name: string): string {
  return name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "media";
}

export async function POST(request: Request) {
  const profile = await getStaffProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canWrite(profile.role)) return NextResponse.json({ error: "Manager role required" }, { status: 403 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase storage is not connected" }, { status: 503 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload a file using the media form" }, { status: 422 });
  }
  const file = form.get("file");
  const altText = String(form.get("altText") || "").trim();
  const slotBinding = String(form.get("slotBinding") || "").trim();
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file" }, { status: 422 });
  if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "File must be 12 MB or smaller" }, { status: 422 });
  if (altText.length < 5 || altText.length > 300) return NextResponse.json({ error: "Alt text must be 5–300 characters" }, { status: 422 });
  if (!/^[a-z0-9-]{0,80}$/.test(slotBinding)) return NextResponse.json({ error: "Template slot may only use lowercase letters, numbers, and hyphens" }, { status: 422 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const detected = SIGNATURES.find((signature) => signature.matches(bytes));
  if (!detected || detected.type !== file.type) {
    return NextResponse.json({ error: "Use a real JPG, PNG, WebP, AVIF, MP4, or WebM file" }, { status: 422 });
  }

  // Only the slots the approved design exposes can be filled, and a slot photo must be large
  // enough for the box it is cropped into.
  const dimensions = imageDimensions(bytes, detected.type);
  if (slotBinding) {
    const slot = findMediaSlot(slotBinding);
    if (!slot) return NextResponse.json({ error: "That template slot does not exist in the approved design" }, { status: 422 });
    if (!detected.type.startsWith("image/")) return NextResponse.json({ error: "Template slots take an image, not a video" }, { status: 422 });
    if (dimensions && (dimensions.width < slot.minWidth || dimensions.height < slot.minHeight)) {
      return NextResponse.json({ error: `${slot.label} needs an image at least ${slot.minWidth}×${slot.minHeight}px; this one is ${dimensions.width}×${dimensions.height}px` }, { status: 422 });
    }
  }

  const storagePath = `${TENANT_ID}/${new Date().getUTCFullYear()}/${safeBaseName(file.name)}-${randomUUID()}.${detected.extension}`;
  const uploaded = await supabase.storage.from(BUCKET).upload(storagePath, bytes, { contentType: detected.type, upsert: false, cacheControl: "31536000" });
  if (uploaded.error) {
    if (/bucket not found/i.test(uploaded.error.message)) {
      return NextResponse.json({ error: "Media storage is not set up. Run the database migrations." }, { status: 503 });
    }
    console.error("[admin/media] upload failed", uploaded.error);
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }

  try {
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
    const row = await insertRecord("media_assets", {
      file_name: file.name.slice(0, 180),
      storage_path: publicUrl,
      alt_text: altText,
      mime_type: detected.type,
      slot_binding: slotBinding || null,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
    }, profile.id);
    // A photo bound to a design slot is live content: refresh the pages that show it.
    if (slotBinding) revalidatePath("/", "layout");
    return NextResponse.json({ row }, { status: 201 });
  } catch (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    console.error("[admin/media] metadata insert failed", error);
    return NextResponse.json({ error: "Could not save media record" }, { status: 500 });
  }
}

/** The object key inside the bucket, recovered from the stored public URL. */
function objectKey(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  return index < 0 ? null : decodeURIComponent(publicUrl.slice(index + marker.length));
}

/**
 * Removes an upload from the bucket and the library. Media that is currently on the website is
 * refused rather than deleted, so a live page can never end up pointing at a missing file.
 */
export async function DELETE(request: Request) {
  const profile = await getStaffProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canWrite(profile.role)) return NextResponse.json({ error: "Manager role required" }, { status: 403 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Media storage is not configured" }, { status: 503 });

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "A valid media id is required" }, { status: 422 });

  const row = await findRecord("media_assets", id);
  if (!row) return NextResponse.json({ error: "That media is not in the library" }, { status: 404 });

  if (row.slot_binding) {
    const slot = findMediaSlot(String(row.slot_binding));
    return NextResponse.json({
      error: `This photo is live in the ${slot?.label ?? "template"} slot. Upload a replacement for that slot first, then delete this one.`,
    }, { status: 409 });
  }

  const inUse = (await listRecords("case_studies", 500)).find((study) => study.before_media_id === id || study.after_media_id === id);
  if (inUse) {
    return NextResponse.json({ error: `This photo is used by the case study "${String(inUse.title)}". Change that case study first.` }, { status: 409 });
  }

  const key = objectKey(String(row.storage_path));
  if (key) {
    const { error } = await supabase.storage.from(BUCKET).remove([key]);
    // Deleting the row while the file survives would leave it publicly reachable, so surface it.
    if (error && !/not found/i.test(error.message)) {
      console.error("[admin/media] could not remove the stored file", error);
      return NextResponse.json({ error: "The file could not be removed from storage; nothing was deleted." }, { status: 502 });
    }
  }

  await deleteRecord("media_assets", id, profile.id);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
