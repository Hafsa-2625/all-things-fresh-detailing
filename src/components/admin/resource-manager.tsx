"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ResourceName } from "@/lib/operations/schemas";
import type { StoredRecord } from "@/lib/operations/store";

export interface AdminField {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "date" | "datetime-local" | "textarea" | "select" | "json" | "relation" | "repeater";
  required?: boolean;
  /** Plain values, or value + label when the stored value is not human-readable (e.g. a media id). Also the option list for `relation` fields. */
  options?: (string | { value: string; label: string })[];
  placeholder?: string;
  /** `relation` only: render a multi-select backed by a jsonb array (e.g. `jobs.crew_ids`) instead of a single value. */
  multiple?: boolean;
  /** `repeater` only: the shape of one row. Omit for a repeater of plain strings (e.g. a neighbourhood list). */
  repeaterFields?: { name: string; label: string; type?: "text" | "number" | "textarea" }[];
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function optionLabel(options: AdminField["options"], value: string): string {
  const match = options?.find((option) => (typeof option === "string" ? option === value : option.value === value));
  if (!match) return value;
  return typeof match === "string" ? match : match.label;
}

/** A jsonb array of ids, edited as checkboxes over the same `options` a single relation would use. */
function MultiRelationField({ name, options, defaultValue }: { name: string; options: AdminField["options"]; defaultValue: string[] }) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  function toggle(value: string) {
    setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }
  return (
    <div className="grid gap-1 rounded-[8px] border border-[#dcd9d4] bg-white p-2 max-h-[140px] overflow-y-auto">
      <input type="hidden" name={name} value={JSON.stringify(selected)} />
      {(options ?? []).map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        return (
          <label key={value} className="flex items-center gap-2 text-[12px] font-normal">
            <input type="checkbox" checked={selected.includes(value)} onChange={() => toggle(value)} />
            {label}
          </label>
        );
      })}
      {(!options || options.length === 0) && <span className="text-[11px] text-[#929292]">Nothing to choose from yet</span>}
    </div>
  );
}

/** An array field (objects or plain strings) edited as add/remove rows instead of raw JSON. */
function RepeaterField({ name, rowFields, defaultValue }: { name: string; rowFields?: AdminField["repeaterFields"]; defaultValue: unknown }) {
  const primitive = !rowFields || rowFields.length === 0;
  const seed = Array.isArray(defaultValue) ? defaultValue : [];
  const [rows, setRows] = useState<Record<string, string>[]>(
    primitive
      ? seed.map((value) => ({ value: String(value) }))
      : seed.map((row) => Object.fromEntries((rowFields ?? []).map((field) => [field.name, String((row as Record<string, unknown>)?.[field.name] ?? "")]))),
  );

  function updateRow(index: number, key: string, value: string) {
    setRows((current) => current.map((row, i) => i === index ? { ...row, [key]: value } : row));
  }
  function addRow() {
    setRows((current) => [...current, primitive ? { value: "" } : Object.fromEntries((rowFields ?? []).map((field) => [field.name, ""]))]);
  }
  function removeRow(index: number) {
    setRows((current) => current.filter((_, i) => i !== index));
  }

  const serialized = primitive
    ? rows.map((row) => row.value).filter((value) => value !== "")
    : rows.filter((row) => Object.values(row).some((value) => value !== ""));

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={JSON.stringify(serialized)} />
      <div className="grid gap-2">
        {rows.map((row, index) => (
          <div key={index} className="flex flex-wrap items-start gap-2 rounded-[8px] border border-[#dcd9d4] bg-white p-2">
            {primitive ? (
              <input value={row.value} onChange={(event) => updateRow(index, "value", event.target.value)} className="min-w-0 flex-1 rounded-[6px] border border-[#dcd9d4] px-2 py-1.5 text-[12px]" />
            ) : (
              (rowFields ?? []).map((field) => (
                field.type === "textarea"
                  ? <textarea key={field.name} value={row[field.name] ?? ""} onChange={(event) => updateRow(index, field.name, event.target.value)} placeholder={field.label} rows={2} className="min-w-[120px] flex-1 rounded-[6px] border border-[#dcd9d4] px-2 py-1.5 text-[12px]" />
                  : <input key={field.name} type={field.type === "number" ? "number" : "text"} value={row[field.name] ?? ""} onChange={(event) => updateRow(index, field.name, event.target.value)} placeholder={field.label} className="min-w-[100px] flex-1 rounded-[6px] border border-[#dcd9d4] px-2 py-1.5 text-[12px]" />
              ))
            )}
            <button type="button" onClick={() => removeRow(index)} className="shrink-0 rounded-full border border-[#dcd9d4] bg-white px-2.5 py-1 text-[11px] font-bold transition-colors hover:border-[#b9b4ad] hover:bg-[#f4f4f5]">Remove</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addRow} className="w-fit rounded-full border border-[#dcd9d4] bg-white px-3 py-1.5 text-[11px] font-bold transition-colors hover:border-[#b9b4ad] hover:bg-[#f4f4f5]">+ Add row</button>
    </div>
  );
}

function formValues(form: HTMLFormElement, fields: AdminField[]) {
  const data = new FormData(form);
  return Object.fromEntries(fields.map((field) => {
    const raw = data.get(field.name);
    if (field.type === "number") return [field.name, raw === "" ? undefined : Number(raw)];
    if (field.type === "json" || field.type === "repeater" || (field.type === "relation" && field.multiple)) {
      try { return [field.name, raw ? JSON.parse(String(raw)) : []]; } catch { throw new Error(`${field.label} must be valid`); }
    }
    return [field.name, raw === "" ? undefined : raw];
  }).filter(([, value]) => value !== undefined));
}

function defaultFieldValue(row: StoredRecord, field: AdminField): string | number {
  const value = row[field.name];
  if (value === null || value === undefined) return "";
  if (field.type === "json") return JSON.stringify(value, null, 2);
  if (field.type === "date" && typeof value === "string") return value.slice(0, 10);
  if (field.type === "datetime-local" && typeof value === "string") return value.slice(0, 16);
  return typeof value === "number" ? value : String(value);
}

function FieldInput({ field, row, editing }: { field: AdminField; row: StoredRecord | null; editing: boolean }) {
  const borderClass = editing ? "border-[#c9d8ea]" : "border-[#dcd9d4]";
  if (field.type === "textarea" || field.type === "json") {
    return <textarea name={field.name} required={field.required} defaultValue={row ? defaultFieldValue(row, field) : undefined} placeholder={field.placeholder} rows={3} className={`rounded-[8px] border ${borderClass} bg-white px-3 py-2 text-[12px] font-normal`} />;
  }
  if (field.type === "repeater") {
    return <RepeaterField name={field.name} rowFields={field.repeaterFields} defaultValue={row ? row[field.name] : []} />;
  }
  if (field.type === "relation" && field.multiple) {
    return <MultiRelationField name={field.name} options={field.options} defaultValue={row ? asStringArray(row[field.name]) : []} />;
  }
  if (field.type === "select" || field.type === "relation") {
    return (
      <select name={field.name} required={field.required} defaultValue={row ? defaultFieldValue(row, field) : ""} className={`rounded-[8px] border ${borderClass} bg-white px-3 py-2 text-[12px] font-normal`}>
        <option value="">{field.type === "relation" ? "Not linked" : "Select"}</option>
        {field.options?.map((option) => typeof option === "string" ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  }
  return <input name={field.name} required={field.required} type={field.type || "text"} defaultValue={row ? defaultFieldValue(row, field) : undefined} placeholder={field.placeholder} className={`rounded-[8px] border ${borderClass} bg-white px-3 py-2 text-[12px] font-normal`} />;
}

export function ResourceManager({
  resource,
  title,
  description,
  initialRows,
  columns,
  fields,
  canEdit,
  canDelete = canEdit,
  statusField,
  statusOptions,
  detailHrefPrefix,
}: {
  resource: ResourceName;
  title: string;
  description?: string;
  initialRows: StoredRecord[];
  columns: string[];
  fields: AdminField[];
  canEdit: boolean;
  canDelete?: boolean;
  statusField?: string;
  statusOptions?: string[];
  /** Base path for a per-row "View" link, e.g. "/admin/customers" → "/admin/customers/<id>". A
   *  plain string rather than a callback because Server Components can only pass serializable props. */
  detailHrefPrefix?: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const sorted = useMemo(() => [...rows].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))), [rows]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((row) => columns.some((column) => display(row[column]).toLowerCase().includes(q)));
  }, [sorted, query, columns]);
  const editingRow = rows.find((row) => row.id === editingId) ?? null;
  const actionsColumn = canEdit || canDelete || statusField || detailHrefPrefix;

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // React clears event.currentTarget once the handler returns, so it is null after the first
    // await. Hold the form itself to reset it later.
    const form = event.currentTarget;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/data/${resource}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(formValues(form, fields)),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save");
      setRows((current) => [payload.row, ...current]);
      form.reset();
      setMessage("Saved");
      // Panels fed by server-rendered props (line items, relation pickers) need the new row too.
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingRow) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/data/${resource}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: editingRow.id, values: formValues(event.currentTarget, fields) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not update");
      setRows((current) => current.map((item) => item.id === editingRow.id ? payload.row : item));
      setEditingId(null);
      setMessage("Changes saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(row: StoredRecord, nextStatus: string) {
    if (!statusField) return;
    setMessage("");
    const response = await fetch(`/api/admin/data/${resource}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: row.id, values: { [statusField]: nextStatus } }),
    });
    const payload = await response.json();
    if (!response.ok) { setMessage(payload.error || "Could not update"); return; }
    setRows((current) => current.map((item) => item.id === row.id ? payload.row : item));
  }

  async function remove(row: StoredRecord) {
    if (!window.confirm(`Delete this ${title.replace(/s$/, "").toLowerCase()}? This can't be undone.`)) return;
    setMessage("");
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/data/${resource}?id=${row.id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not delete");
      setRows((current) => current.filter((item) => item.id !== row.id));
      if (editingId === row.id) setEditingId(null);
      setMessage("Deleted");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[14px] border border-[#e7e5e1] bg-white p-5 shadow-[0_14px_34px_rgba(20,26,40,0.05)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.03em]">{title}</h2>
          {description && <p className="mt-1 max-w-[700px] text-[12px] leading-5 text-[#747474]">{description}</p>}
        </div>
        <span aria-live="polite" className="text-[12px] text-[#3268B5]">{message}</span>
      </div>

      {canEdit && fields.length > 0 && (
        <form onSubmit={create} className="mb-6 grid gap-3 rounded-[12px] bg-[#fafafa] p-4 sm:grid-cols-2 xl:grid-cols-3">
          {fields.map((field) => (
            <label key={field.name} className="grid gap-1 text-[11px] font-bold text-[#3d3d3d]">
              {field.label}
              <FieldInput field={field} row={null} editing={false} />
            </label>
          ))}
          <div className="flex items-end">
            <button disabled={saving} className="rounded-full bg-[#050505] px-5 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-[#2c3033] disabled:opacity-50 disabled:hover:bg-[#050505]">
              {saving ? "Saving…" : `Add ${title.replace(/s$/, "")}`}
            </button>
          </div>
        </form>
      )}

      {canEdit && editingRow && fields.length > 0 && (
        <form onSubmit={saveEdit} className="mb-6 grid gap-3 rounded-[12px] border border-[#d7e5f7] bg-[#f7fbff] p-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="sm:col-span-2 xl:col-span-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#3268B5]">Editing existing record</p>
          </div>
          {fields.map((field) => (
            <label key={field.name} className="grid gap-1 text-[11px] font-bold text-[#3d3d3d]">
              {field.label}
              <FieldInput field={field} row={editingRow} editing />
            </label>
          ))}
          <div className="flex items-end gap-2">
            <button disabled={saving} className="rounded-full bg-[#050505] px-5 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-[#2c3033] disabled:opacity-50 disabled:hover:bg-[#050505]">
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={() => setEditingId(null)} className="rounded-full border border-[#dcd9d4] bg-white px-5 py-2.5 text-[12px] font-bold transition-colors hover:border-[#b9b4ad] hover:bg-[#f4f4f5]">
              Cancel
            </button>
          </div>
        </form>
      )}

      {rows.length > 8 && (
        <div className="mb-3">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()}…`} className="w-full max-w-[320px] rounded-full border border-[#dcd9d4] bg-white px-4 py-2 text-[12px]" />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-[12px]">
          <thead><tr className="border-b border-[#e7e5e1] text-[10px] uppercase tracking-[0.08em] text-[#929292]">
            {columns.map((column) => <th key={column} className="px-3 py-2 font-bold">{column.replaceAll("_", " ")}</th>)}
            {actionsColumn && <th className="px-3 py-2 font-bold">Actions</th>}
          </tr></thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-[#efedea] align-top">
                {columns.map((column) => <td key={column} className="max-w-[260px] px-3 py-3 leading-5 text-[#4f4f4f]"><span className="line-clamp-3">{column.endsWith("_id") ? optionLabel(fields.find((field) => field.name === column)?.options, String(row[column] ?? "")) : display(row[column])}</span></td>)}
                {actionsColumn && <td className="px-3 py-3"><div className="flex flex-wrap gap-2">
                  {detailHrefPrefix && <a href={`${detailHrefPrefix}/${row.id}`} className="rounded-full border border-[#dcd9d4] bg-white px-3 py-1.5 text-[11px] font-bold transition-colors hover:border-[#b9b4ad] hover:bg-[#f4f4f5]">View</a>}
                  {canEdit && fields.length > 0 && <button type="button" onClick={() => { setEditingId(row.id); setMessage(""); }} className="rounded-full border border-[#dcd9d4] bg-white px-3 py-1.5 text-[11px] font-bold transition-colors hover:border-[#b9b4ad] hover:bg-[#f4f4f5]">Edit</button>}
                  {statusField && <select value={String(row[statusField] ?? "")} disabled={!canEdit} onChange={(event) => updateStatus(row, event.target.value)} className="rounded-full border border-[#dcd9d4] bg-white px-3 py-1.5 text-[11px]">
                    {statusOptions?.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>}
                  {canDelete && <button type="button" disabled={saving} onClick={() => remove(row)} className="rounded-full border border-[#e2b8b8] bg-white px-3 py-1.5 text-[11px] font-bold text-[#a33] transition-colors hover:bg-[#fdf3f3] disabled:opacity-40 disabled:hover:bg-white">Delete</button>}
                </div></td>}
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={columns.length + (actionsColumn ? 1 : 0)} className="px-3 py-8 text-center text-[#929292]">{rows.length === 0 ? "No records yet." : "No records match your search."}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
