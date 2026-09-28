"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import type { StoredRecord } from "@/lib/operations/store";
import { MEDIA_SLOTS } from "@/lib/content/media-slots";

export function MediaLibrary({ initialRows, canEdit }: { initialRows: StoredRecord[]; canEdit: boolean }) {
  const [rows, setRows] = useState(initialRows);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const form = event.currentTarget;
      const response = await fetch("/api/admin/media", { method: "POST", body: new FormData(form) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Upload failed");
      setRows((current) => [payload.row, ...current]);
      form.reset(); setMessage("Media uploaded");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed"); }
    finally { setSaving(false); }
  }

  async function remove(row: StoredRecord) {
    if (!window.confirm(`Delete "${String(row.file_name)}"? The file is removed from storage too and cannot be recovered.`)) return;
    setSaving(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/media?id=${row.id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      // A photo that is live on the site is refused, with the reason to act on.
      if (!response.ok) throw new Error(payload.error || "Could not delete");
      setRows((current) => current.filter((item) => item.id !== row.id));
      setMessage("Media deleted");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not delete"); }
    finally { setSaving(false); }
  }

  return <section className="rounded-[14px] border border-[#e7e5e1] bg-white p-5 shadow-[0_14px_34px_rgba(20,26,40,0.05)]">
    <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-[18px] font-bold tracking-[-0.03em]">Media library</h2><p className="mt-1 text-[12px] leading-5 text-[#747474]">Upload approved visuals and bind them to a named template slot; the newest photo for a slot is the one shown, resized for the web. Public layout controls remain locked.</p></div><span aria-live="polite" className="text-[12px] text-[#3268B5]">{message}</span></div>
    {canEdit && <form onSubmit={upload} className="mb-6 grid gap-3 rounded-[12px] bg-[#fafafa] p-4 md:grid-cols-3">
      <label className="grid min-w-0 gap-1 text-[11px] font-bold">File<input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" required className="w-full min-w-0 truncate rounded-[8px] border border-[#dcd9d4] bg-white px-3 py-2 text-[12px] font-normal" /></label>
      <label className="grid min-w-0 gap-1 text-[11px] font-bold">Alt text<input name="altText" required minLength={5} maxLength={300} placeholder="Describe the visible subject" className="w-full min-w-0 truncate rounded-[8px] border border-[#dcd9d4] bg-white px-3 py-2 text-[12px] font-normal" /></label>
      <label className="grid min-w-0 gap-1 text-[11px] font-bold">Template slot
        <select name="slotBinding" className="w-full min-w-0 truncate rounded-[8px] border border-[#dcd9d4] bg-white px-3 py-2 text-[12px] font-normal">
          <option value="">Library only (no slot)</option>
          {MEDIA_SLOTS.map((slot) => <option key={slot.id} value={slot.id}>{slot.label} — {slot.context} ({slot.minWidth}×{slot.minHeight} or larger)</option>)}
        </select>
      </label>
      <button disabled={saving} className="w-max rounded-full bg-[#050505] px-5 py-2.5 text-[12px] font-bold text-white disabled:opacity-50">{saving ? "Uploading…" : "Upload media"}</button>
    </form>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{rows.map((row) => <article key={row.id} className="overflow-hidden rounded-[12px] border border-[#e7e5e1]">
      {String(row.mime_type || "").startsWith("image/") ? <Image unoptimized width={640} height={480} src={String(row.storage_path)} alt={String(row.alt_text)} className="aspect-[4/3] w-full object-cover" /> : <video src={String(row.storage_path)} controls className="aspect-[4/3] w-full bg-black object-cover" />}
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold">{String(row.file_name)}</p>
          <p className="mt-1 text-[10px] text-[#747474]">{String(row.slot_binding || "Unassigned")}</p>
        </div>
        {canEdit && <button type="button" disabled={saving} onClick={() => remove(row)} className="shrink-0 rounded-full border border-[#e2b8b8] bg-white px-2.5 py-1 text-[11px] font-bold text-[#a33] transition-colors hover:bg-[#fdf3f3] disabled:opacity-40 disabled:hover:bg-white">Delete</button>}
      </div>
    </article>)}{rows.length === 0 && <p className="text-[12px] text-[#929292]">No uploaded media yet. The generated production assets remain in the versioned public assets folder.</p>}</div>
  </section>;
}
