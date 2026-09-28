import "server-only";

import { isOpenQuote } from "./quotes";
import { listRecords, type StoredRecord } from "./store";

// Reasonable defaults, not requirements from the owner — change here if a different window is wanted.
const STALE_LEAD_DAYS = 3;
const QUOTE_EXPIRY_WARNING_DAYS = 7;

/** New leads that have sat untouched for a few days. */
export async function staleLeads(): Promise<StoredRecord[]> {
  const leads = await listRecords("leads", 500);
  const cutoff = Date.now() - STALE_LEAD_DAYS * 24 * 60 * 60 * 1000;
  return leads.filter((lead) => {
    if (String(lead.stage ?? "new") !== "new") return false;
    return new Date(String(lead.created_at)).getTime() < cutoff;
  });
}

/**
 * Open quotes, and the draft or sent ones that expire within a week (or already have) without an
 * answer, soonest first.
 */
export async function quoteInsights(): Promise<{ open: StoredRecord[]; expiring: StoredRecord[] }> {
  const quotes = await listRecords("quotes", 500);
  const cutoff = new Date(Date.now() + QUOTE_EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const expiring = quotes
    .filter((quote) => ["draft", "sent"].includes(String(quote.status)) && typeof quote.expires_on === "string" && quote.expires_on <= cutoff)
    .sort((a, b) => String(a.expires_on).localeCompare(String(b.expires_on)));
  return { open: quotes.filter(isOpenQuote), expiring };
}
