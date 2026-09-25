"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export interface WorkflowField {
  name: string;
  label: string;
  type?: "text" | "date" | "datetime-local" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  required?: boolean;
}

/** A small form that calls one workflow API route and refreshes the page's server data on success. */
/**
 * `successMessage` is a plain string, not a callback: props crossing from a Server Component
 * into a Client Component must be serializable, and a function here fails the production build
 * with "Functions cannot be passed directly to Client Components".
 */
export function WorkflowPanel({ title, description, endpoint, fields, successMessage }: {
  title: string;
  description: string;
  endpoint: string;
  fields: WorkflowField[];
  successMessage?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Held before the first await: React nulls event.currentTarget once the handler returns.
    const form = event.currentTarget;
    setSaving(true);
    setMessage("");
    const data = new FormData(form);
    const body: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = data.get(field.name);
      if (field.type === "checkbox") body[field.name] = raw === "on";
      else if (raw) body[field.name] = raw;
    }
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not complete this action");
      setMessage(successMessage || "Done");
      form.reset();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not complete this action");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[14px] border border-[#e7e5e1] bg-white p-5 shadow-[0_14px_34px_rgba(20,26,40,0.05)]">
      <h2 className="text-[16px] font-bold tracking-[-0.03em]">{title}</h2>
      <p className="mt-1 text-[12px] text-[#747474]">{description}</p>
      <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
        {fields.map((field) => (
          <label key={field.name} className="grid gap-1 text-[11px] font-bold text-[#3d3d3d]">
            {field.label}
            {field.type === "select" ? (
              <select name={field.name} required={field.required} className="min-w-[220px] rounded-[8px] border border-[#dcd9d4] bg-white px-3 py-2 text-[12px] font-normal">
                <option value="">Choose…</option>
                {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : field.type === "checkbox" ? (
              <input type="checkbox" name={field.name} className="mt-2 h-4 w-4" />
            ) : (
              <input name={field.name} type={field.type || "text"} required={field.required} className="rounded-[8px] border border-[#dcd9d4] bg-white px-3 py-2 text-[12px] font-normal" />
            )}
          </label>
        ))}
        <button disabled={saving} className="rounded-full bg-[#050505] px-5 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-[#2c3033] disabled:opacity-50 disabled:hover:bg-[#050505]">{saving ? "Working…" : "Run"}</button>
      </form>
      {message && <p aria-live="polite" className="mt-2 text-[12px] text-[#3268B5]">{message}</p>}
    </section>
  );
}
