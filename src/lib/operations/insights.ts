import "server-only";

import { listRecords, type StoredRecord } from "./store";

// Reasonable defaults, not requirements from the owner — change here if a different window is wanted.
const STALE_LEAD_DAYS = 3;

/** New leads that have sat untouched for a few days. */
export async function staleLeads(): Promise<StoredRecord[]> {
  const leads = await listRecords("leads", 500);
  const cutoff = Date.now() - STALE_LEAD_DAYS * 24 * 60 * 60 * 1000;
  return leads.filter((lead) => {
    if (String(lead.stage ?? "new") !== "new") return false;
    return new Date(String(lead.created_at)).getTime() < cutoff;
  });
}
