import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { emailNewLead } from "@/lib/email/lead-notification";
import { emailLeadConfirmation } from "@/lib/email/lead-confirmation";
import { publicLeadIntakeSchema } from "@/lib/operations/schemas";
import { insertRecord } from "@/lib/operations/store";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const MAX_BODY_BYTES = 64 * 1024;
const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 8;

async function notifyLead(payload: Record<string, unknown>) {
  const endpoint = process.env.LEAD_NOTIFICATION_WEBHOOK_URL;
  if (!endpoint) return;
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.LEAD_NOTIFICATION_WEBHOOK_SECRET) {
    headers["x-atf-signature"] = createHmac("sha256", process.env.LEAD_NOTIFICATION_WEBHOOK_SECRET).update(body).digest("hex");
  }
  const response = await fetch(endpoint, { method: "POST", headers, body, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Lead notification failed with ${response.status}`);
}

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }
  const limit = await rateLimit(`lead:${clientIp(request)}`, WINDOW_SECONDS, MAX_REQUESTS);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Please wait before trying again" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = publicLeadIntakeSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  }
  if (parsed.data.website) return NextResponse.json({ accepted: true }, { status: 202 });

  const fullName = parsed.data.name || [parsed.data.firstName, parsed.data.lastName].filter(Boolean).join(" ");
  let row;
  try {
    row = await insertRecord("leads", {
      name: fullName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      address: [parsed.data.street, parsed.data.unit, parsed.data.city, parsed.data.state, parsed.data.postalCode].filter(Boolean).join(", ") || null,
      requested_service: parsed.data.service || null,
      vehicle_type: parsed.data.vehicleType || null,
      vehicle_description: parsed.data.vehicle || parsed.data.notes || null,
      preferred_date: parsed.data.preferredDate || null,
      source: parsed.data.source || "website",
      stage: "new",
      // Consent is only recorded when the visitor explicitly gives it. The approved
      // forms have no consent control yet, so this stays false until one is approved.
      consent_sms_transactional: parsed.data.smsConsent === true,
      consent_sms_marketing: false,
      consent_email_marketing: false,
      raw_payload: parsed.data,
    });
  } catch (error) {
    console.error("[leads] lead could not be stored", error);
    return NextResponse.json({ error: "We could not save your request. Please call us instead." }, { status: 503 });
  }

  const lead = { id: row.id, ...parsed.data, name: fullName };
  const notifications = await Promise.allSettled([notifyLead(lead), emailNewLead(lead), emailLeadConfirmation(lead)]);
  for (const result of notifications) {
    if (result.status === "rejected") console.error("Lead stored, notification failed", result.reason);
  }

  return NextResponse.json({ accepted: true, leadId: row.id }, { status: 201 });
}
