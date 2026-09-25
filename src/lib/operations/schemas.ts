import { z } from "zod";
import { isSafeInternalPath } from "@/lib/security/paths";

const id = z.string().uuid();
const internalPath = z.string().trim().max(500).refine(isSafeInternalPath, { message: "Use a path on this site that starts with a single /" });
/** Calendar date the database will accept (rejects values like 2026-02-31). */
const isoDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, { message: "Use a valid date" });
const short = z.string().trim().min(1).max(180);
const optionalShort = z.string().trim().max(180).optional().nullable();
const money = z.coerce.number().finite().min(0).max(10_000_000);
const formBoolean = z.union([z.boolean(), z.enum(["true", "false"]).transform((value) => value === "true")]);

export const leadIntakeSchema = z.object({
  name: z.string().trim().max(160).optional(),
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  phone: z.string().trim().min(7).max(30),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
  street: z.string().trim().max(180).optional(),
  unit: z.string().trim().max(80).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(30).optional(),
  postalCode: z.string().trim().max(20).optional(),
  service: z.string().trim().max(160).optional(),
  vehicleType: z.string().trim().max(80).optional(),
  vehicle: z.string().trim().max(180).optional(),
  preferredDate: z.union([isoDate, z.literal("")]).optional(),
  notes: z.string().trim().max(4000).optional(),
  source: z.string().trim().max(240).optional(),
  /** Only an explicit opt-in counts; a checkbox submits "on". */
  smsConsent: z.union([z.boolean(), z.enum(["on", "true"]).transform(() => true)]).optional(),
  website: z.string().max(0).optional(),
}).refine((value) => Boolean(value.name || value.firstName || value.lastName), {
  message: "Name is required",
  path: ["name"],
});

/**
 * The public forms mark the date required in the browser, which a direct POST can skip, so the
 * intake route enforces it too. Kept separate from `leadIntakeSchema` because staff adding a lead
 * by phone in the admin legitimately have no date yet — and that form has no date field at all.
 */
export const publicLeadIntakeSchema = leadIntakeSchema.safeExtend({ preferredDate: isoDate });

const status = z.string().trim().min(1).max(60);

export const resourceCreateSchemas = {
  leads: leadIntakeSchema.extend({ requested_service: optionalShort, stage: status.optional(), owner_id: id.optional().nullable(), customer_id: id.optional().nullable() }),
  customers: z.object({ name: short, phone: optionalShort, email: z.string().email().optional().nullable(), street: optionalShort, city: optionalShort, state: optionalShort, postal_code: optionalShort, notes: z.string().max(5000).optional().nullable() }),
  vehicles: z.object({ customer_id: id, year: z.coerce.number().int().min(1900).max(2100).optional().nullable(), make: optionalShort, model: optionalShort, color: optionalShort, plate: optionalShort, notes: z.string().max(5000).optional().nullable() }),
  appointments: z.object({ lead_id: id.optional().nullable(), customer_id: id.optional().nullable(), vehicle_id: id.optional().nullable(), service_id: id.optional().nullable(), starts_at: z.string(), ends_at: z.string().optional().nullable(), status: status.default("scheduled"), address: optionalShort, notes: z.string().max(5000).optional().nullable() }),
  jobs: z.object({ appointment_id: id.optional().nullable(), customer_id: id.optional().nullable(), vehicle_id: id.optional().nullable(), status: status.default("scheduled"), scheduled_date: z.string().optional().nullable(), arrival_window: optionalShort, address: optionalShort, checklist: z.array(z.unknown()).default([]), notes: z.string().max(5000).optional().nullable() }),
  // Field limits mirror the space the approved components give each slot (spec §4), and the array
  // limits mirror how many of each the design renders.
  services: z.object({ name: short, slug: z.string().regex(/^[a-z0-9-]+$/), short_blurb: z.string().max(240), long_body: z.string().max(20000).optional().nullable(), price_from: money.optional().nullable(), status: status.default("draft"), seo_title: optionalShort, seo_description: z.string().max(320).optional().nullable(), media_path: optionalShort,
    packages: z.array(z.object({ name: z.string().trim().min(1).max(40), price_label: z.string().trim().max(24).default(""), blurb: z.string().trim().max(160).default("") })).max(3).default([]),
    inclusions: z.array(z.object({ title: z.string().trim().min(1).max(60), note: z.string().trim().max(160).default("") })).max(6).default([]),
    faqs: z.array(z.object({ question: z.string().trim().min(1).max(90), answer: z.string().trim().min(1).max(220) })).max(4).default([]) }),
  locations: z.object({ city: short, state: z.string().trim().length(2).default("OH"), slug: z.string().regex(/^[a-z0-9-]+$/), local_intro: z.string().min(120).max(12000), neighborhoods: z.array(z.string().max(120)).max(24).default([]), status: status.default("draft"), seo_title: optionalShort, seo_description: z.string().max(320).optional().nullable(),
    local_differentiators: z.array(z.object({ title: z.string().trim().min(1).max(40), note: z.string().trim().max(110).default("") })).max(3).default([]),
    drive_time: z.string().trim().max(12).optional().nullable(), time_on_site_label: z.string().trim().max(12).optional().nullable(), travel_fee_label: z.string().trim().max(12).optional().nullable(), map_query: z.string().trim().max(120).optional().nullable() }),
  add_ons: z.object({ name: z.string().trim().min(1).max(40), price_label: z.string().trim().min(1).max(24), applies_to: z.array(z.string().regex(/^[a-z0-9-]+$/)).max(30).default([]), sort_order: z.coerce.number().int().min(0).max(999).default(0), status: status.default("draft") }),
  content_pages: z.object({ title: short, slug: z.string().regex(/^[a-z0-9\/-]+$/), page_type: status, status: status.default("draft"), eyebrow: optionalShort, heading: short, intro: z.string().max(2000), sections: z.array(z.unknown()).default([]), seo_title: optionalShort, seo_description: z.string().max(320).optional().nullable(), canonical_url: optionalShort, robots: z.string().max(80).default("index,follow"), schema_json: z.record(z.string(), z.unknown()).default({}) }),
  articles: z.object({ title: short, slug: z.string().regex(/^[a-z0-9-]+$/), category: optionalShort, lede: z.string().min(80).max(2000), body: z.array(z.unknown()).default([]), status: status.default("draft"), seo_title: optionalShort, seo_description: z.string().max(320).optional().nullable() }),
  case_studies: z.object({ title: short, slug: z.string().regex(/^[a-z0-9-]+$/), vehicle: short, city: short, service: short, summary: z.string().min(80).max(5000), steps: z.array(z.unknown()).default([]), stats: z.array(z.unknown()).default([]), status: status.default("draft"), before_media_id: id.optional().nullable(), after_media_id: id.optional().nullable(), approved_quote: z.string().trim().max(600).optional().nullable(), quote_name: optionalShort, completed_on: z.string().optional().nullable() }),
  reviews: z.object({ customer_name: short, review_date: z.string().optional().nullable(), stars: z.coerce.number().int().min(1).max(5), text: z.string().min(10).max(5000), source: optionalShort, city: optionalShort, approved: formBoolean.default(false), featured: formBoolean.default(false) }),
  media_assets: z.object({ file_name: short, storage_path: short, alt_text: z.string().min(5).max(300), mime_type: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm"]), width: z.coerce.number().int().positive().optional().nullable(), height: z.coerce.number().int().positive().optional().nullable(), slot_binding: optionalShort }),
  redirects: z.object({ source_path: internalPath, destination_path: internalPath, status_code: z.coerce.number().refine((value) => [301,302,307,308].includes(value)).default(301), active: formBoolean.default(true) }),
  notification_rules: z.object({ event: status, channel: z.enum(["email", "sms", "webhook"]), destination: short, active: formBoolean.default(true) }),
  staff_invites: z.object({ email: z.string().trim().toLowerCase().email().max(254), role: z.enum(["super_admin", "admin", "manager", "editor"]).default("editor"), expires_at: z.string().optional().nullable() }),
} as const;

export type ResourceName = keyof typeof resourceCreateSchemas;
export const resourceNames = Object.keys(resourceCreateSchemas) as ResourceName[];

export function isResourceName(value: string): value is ResourceName {
  return resourceNames.includes(value as ResourceName);
}

export const resourceUpdateSchemas = Object.fromEntries(
  Object.entries(resourceCreateSchemas).map(([key, schema]) => [
    key,
    key === "leads"
      ? z.object({ name: short.optional(), phone: z.string().trim().min(7).max(30).optional(), email: z.union([z.string().trim().email().max(254), z.literal("")]).optional().nullable(), requested_service: optionalShort, source: optionalShort, stage: status.optional(), owner_id: id.optional().nullable(), customer_id: id.optional().nullable(), notes: z.string().max(5000).optional().nullable() })
      : schema.partial(),
  ]),
) as unknown as { [K in ResourceName]: z.ZodType<Record<string, unknown>> };
