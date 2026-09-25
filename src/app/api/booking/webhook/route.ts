import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenant } from "@/tenant/get-tenant";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const WINDOW_SECONDS = 10 * 60;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_BODY_BYTES = 64 * 1024;

const bookingPayloadSchema = z
  .object({
    reference: z.string().trim().min(4).max(32),
    step: z.number().int().min(1).max(7).optional(),
    serviceId: z.string().trim().min(1).max(100),
    vehicleType: z.enum(["sedan", "suv", "truck", "van", "luxury", "boat"]),
    addOnIds: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
    vehicleDescription: z.string().trim().min(1).max(200),
    notes: z.string().trim().max(2000).default(""),
    date: z.string().trim().min(1).max(32),
    timeOfDay: z.enum(["morning", "afternoon", "evening"]),
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254).or(z.literal("")),
    phone: z.string().trim().min(7).max(40),
    contactMethod: z.enum(["phone", "email", "text"]),
    website: z.string().max(200).optional().default(""),
    status: z.enum(["editing", "submitting", "error", "done"]).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.contactMethod === "email" && !value.email) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Email is required when email is the preferred contact method.",
      });
    }
  });


/**
 * Server-side relay for webhook-mode booking.
 *
 * Security baseline included here:
 * - body-size guard
 * - same-origin browser request check
 * - server-side schema validation
 * - service-ID validation against the active tenant
 * - per-instance rate limiting
 * - optional HMAC signing for the upstream webhook
 *
 * Production note: the in-memory rate limiter is deliberately a baseline only.
 * Replace it with a shared edge/KV-backed limiter for multi-instance production.
 */
export async function POST(request: Request) {
  const tenant = await getTenant();

  if (!tenant.booking.webhookUrl) {
    return NextResponse.json(
      { error: "booking webhook not configured for this tenant" },
      { status: 501 },
    );
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "content type must be application/json" }, { status: 415 });
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  const rate = await rateLimit(`booking:${clientIp(request)}`, WINDOW_SECONDS, MAX_REQUESTS_PER_WINDOW);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid JSON payload" }, { status: 400 });
  }

  const parsed = bookingPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid booking payload" },
      { status: 400 },
    );
  }

  // Honeypot: real visitors never see/fill this field. Return a generic
  // success to obvious bots so the endpoint does not become an oracle.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  if (!tenant.services.some((service) => service.id === parsed.data.serviceId)) {
    return NextResponse.json({ error: "unknown service" }, { status: 400 });
  }

  const receivedAt = new Date().toISOString();
  const { website: _honeypot, ...booking } = parsed.data;
  void _honeypot;
  const payload = JSON.stringify({
    ...booking,
    tenantId: tenant.tenantId,
    receivedAt,
  });

  const timestamp = String(Math.floor(Date.now() / 1000));
  const signingSecret = process.env.BOOKING_WEBHOOK_SIGNING_SECRET?.trim();
  const signature = signingSecret
    ? `sha256=${createHmac("sha256", signingSecret).update(`${timestamp}.${payload}`).digest("hex")}`
    : "";

  try {
    const upstream = await fetch(tenant.booking.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-JBW-Tenant": tenant.tenantId,
        "X-JBW-Timestamp": timestamp,
        ...(signature ? { "X-JBW-Signature": signature } : {}),
      },
      body: payload,
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "booking destination rejected request" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "booking destination unavailable" }, { status: 502 });
  }
}
