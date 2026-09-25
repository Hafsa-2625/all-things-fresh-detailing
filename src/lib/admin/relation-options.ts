type Labelable = Record<string, unknown>;

/** Turns a resource's rows into `{value,label}` options for a `relation` admin field. */
export function relationOptions<T extends Labelable>(rows: T[], label: (row: T) => string): { value: string; label: string }[] {
  return rows.map((row) => ({ value: String(row.id), label: label(row) || String(row.id) }));
}

export const relationLabels = {
  customer: (row: Labelable) => [row.name, row.phone || row.email].filter(Boolean).join(" — "),
  lead: (row: Labelable) => [row.name, row.phone].filter(Boolean).join(" — "),
  vehicle: (row: Labelable) => [row.year, row.make, row.model].filter(Boolean).join(" ") || "Vehicle",
  service: (row: Labelable) => String(row.name ?? row.slug ?? "Service"),
  job: (row: Labelable) => [row.scheduled_date, row.address].filter(Boolean).join(" — ") || "Job",
  appointment: (row: Labelable) => [row.starts_at, row.address].filter(Boolean).join(" — ") || "Appointment",
  staff: (row: Labelable) => String(row.display_name || row.email),
};
