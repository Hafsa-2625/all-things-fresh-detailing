import { NextResponse } from "next/server";
import { z } from "zod";
import { canWrite, getStaffProfile } from "@/lib/admin/session";
import { QuoteScheduleError, scheduleQuote } from "@/lib/operations/quotes";

/** A datetime-local value, stored as entered like every other appointment time in the admin. */
const startsAt = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/).refine((value) => {
  const parsed = new Date(`${value}Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 16) === value.slice(0, 16);
});

const bodySchema = z.object({ quoteId: z.string().uuid(), startsAt });

/** Turns a quote into an appointment and a job for its customer, and marks the quote accepted. */
export async function POST(request: Request) {
  const profile = await getStaffProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canWrite(profile.role)) return NextResponse.json({ error: "Manager role required" }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return NextResponse.json({ error: "Choose a quote and a valid start time" }, { status: 422 });

  try {
    const scheduled = await scheduleQuote(parsed.data.quoteId, parsed.data.startsAt, profile.id);
    return NextResponse.json(scheduled, { status: 201 });
  } catch (error) {
    if (error instanceof QuoteScheduleError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[workflows/schedule-quote] failed", error);
    return NextResponse.json({ error: "Could not schedule this quote" }, { status: 500 });
  }
}
