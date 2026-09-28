import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StoredRecord } from "./store";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "all-things-fresh";

/** Still waiting on the customer or on scheduling: not declined, not expired, not yet a job. */
export function isOpenQuote(quote: StoredRecord): boolean {
  return ["draft", "sent", "accepted"].includes(String(quote.status)) && !quote.job_id;
}

export class QuoteScheduleError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/**
 * Creates the appointment and job for a quote's customer and marks the quote accepted, all in one
 * database transaction (public.schedule_quote). A quote that is already scheduled is refused
 * there, so two clicks — or two staff members — cannot book it twice.
 */
export async function scheduleQuote(quoteId: string, startsAt: string, actorId: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new QuoteScheduleError("Scheduling needs the database to be connected", 503);
  const { data, error } = await supabase.rpc("schedule_quote", {
    p_tenant_id: TENANT_ID,
    p_quote_id: quoteId,
    p_starts_at: startsAt,
    p_actor: actorId,
  });
  if (error) {
    if (error.code === "P0002") throw new QuoteScheduleError("Quote not found", 404);
    // The function's own refusals (already scheduled, declined, lead not converted) are written for staff.
    if (error.code === "55000") throw new QuoteScheduleError(error.message, 409);
    throw error;
  }
  return data as { quote_id: string; customer_id: string; appointment_id: string; job_id: string };
}
