import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canAssignRole, canManageStaff, canWrite, getStaffProfile, type StaffProfile, type StaffRole } from "@/lib/admin/session";
import { findProfileByEmail } from "@/lib/admin/staff-access";
import { isResourceName, resourceCreateSchemas, resourceUpdateSchemas, type ResourceName } from "@/lib/operations/schemas";
import { deleteRecord, findRecord, findRecordBy, insertRecord, listRecords, updateRecord } from "@/lib/operations/store";
import { closestLocation, LOCATION_SIMILARITY_LIMIT, textSimilarity } from "@/lib/content/similarity";
import { caseStudyProblems } from "@/lib/content/case-studies";
import { locationServicePages } from "@/seo/content/location-service";
import { locationFacts } from "@/seo/content/locations";
import { allThingsFreshTenant } from "@/tenant/tenants/all-things-fresh";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PUBLIC_CONTENT_RESOURCES = new Set(["content_pages", "services", "locations", "articles", "case_studies", "reviews", "redirects", "add_ons"]);
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const recordIdSchema = z.string().uuid();

type RouteContext = { params: Promise<{ resource: string }> };
type Problem = { error: string; status: number };

function revalidatePublicContent(resource: string) {
  if (PUBLIC_CONTENT_RESOURCES.has(resource)) {
    revalidatePath("/", "layout");
    revalidatePath("/sitemap.xml");
  }
}

function problem({ error, status }: Problem) {
  return NextResponse.json({ error }, { status });
}

async function contextResource(context: RouteContext) {
  const { resource } = await context.params;
  return isResourceName(resource) ? resource : null;
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

function writeGuard(profile: StaffProfile, resource: ResourceName): Problem | null {
  if (resource === "staff_invites") {
    return canManageStaff(profile.role) ? null : { error: "Admin role required to manage staff", status: 403 };
  }
  // Recipients receive customer details, so only admins may change where they go.
  if (resource === "notification_rules") {
    return canManageStaff(profile.role) ? null : { error: "Admin role required to manage notifications", status: 403 };
  }
  return canWrite(profile.role) ? null : { error: "Manager role required", status: 403 };
}

function notificationRuleProblem(rule: Record<string, unknown>): Problem | null {
  if (rule.channel === "email" && !z.string().email().safeParse(rule.destination).success) {
    return { error: "Use a valid email address", status: 422 };
  }
  return null;
}

/** Database constraint and type errors are the caller's fault; anything else is logged and hidden. */
function databaseProblem(error: unknown, action: "write" | "delete" = "write"): Problem {
  const code = (error as { code?: string }).code;
  if (code === "23505") return { error: "A record with these details already exists", status: 409 };
  if (code === "23503") {
    return action === "delete"
      ? { error: "Other records still reference this — remove those first", status: 422 }
      : { error: "A linked record does not exist", status: 422 };
  }
  if (code === "23514" || code === "22P02" || code === "22007" || code === "22008") return { error: "One or more values are not valid", status: 422 };
  const message = error instanceof Error ? error.message : "";
  if (message === "Record not found") return { error: "Record not found", status: 404 };
  console.error(`[admin/data] ${action} failed`, error);
  return { error: action === "delete" ? "Could not delete the record" : "Could not save the record", status: 500 };
}

async function redirectProblem(source: string, destination: string, recordId?: string): Promise<Problem | null> {
  if (source === destination) return { error: "A redirect cannot point to its own URL", status: 422 };
  const reverse = await findRecordBy("redirects", "source_path", destination);
  if (reverse && reverse.id !== recordId && reverse.active !== false && reverse.destination_path === source) {
    return { error: "These two redirects would send visitors in a loop", status: 422 };
  }
  return null;
}

/**
 * A city page may not go live while its copy reads like another city's (spec §5, 70% limit).
 * Returns the similarity score to store so the SEO view can show how close each page is.
 */
async function locationSimilarity(values: Record<string, unknown>, recordId?: string): Promise<{ problem: Problem | null; score: number | null }> {
  const candidate = { id: recordId, city: String(values.city ?? ""), local_intro: String(values.local_intro ?? "") };
  if (!candidate.local_intro) return { problem: null, score: null };
  const others = (await listRecords("locations", 500))
    .filter((row) => row.status === "published")
    .map((row) => ({
      id: String(row.id),
      city: typeof row.city === "string" ? row.city : undefined,
      local_intro: typeof row.local_intro === "string" ? row.local_intro : "",
    }));
  const closest = closestLocation(candidate, others);
  if (!closest) return { problem: null, score: 0 };
  const score = Math.round(closest.score * 100);
  if (String(values.status ?? "") === "published" && closest.score > LOCATION_SIMILARITY_LIMIT) {
    return {
      problem: { error: `This copy is ${score}% the same as the ${closest.city} page. Give the city its own details before publishing.`, status: 422 },
      score,
    };
  }
  return { problem: null, score };
}

/** A case study only publishes when it fills every slot of the locked case-study template. */
async function caseStudyProblem(values: Record<string, unknown>): Promise<Problem | null> {
  if (String(values.status ?? "") !== "published") return null;
  const problems = caseStudyProblems(values);
  if (problems.length) return { error: `Not ready to publish: ${problems.join(" ")}`, status: 422 };
  for (const field of ["before_media_id", "after_media_id"] as const) {
    const media = await findRecord("media_assets", String(values[field]));
    if (!media || !String(media.mime_type ?? "").startsWith("image/")) {
      return { error: `The ${field === "before_media_id" ? "before" : "after"} photo must be an image from the media library.`, status: 422 };
    }
  }
  return null;
}

const LOCATION_SERVICE_PATH = /^\/service-area\/([a-z0-9-]+)-oh\/([a-z0-9-]+)$/;
const LOCATION_SERVICE_MIN_INTRO = 120;

function cityName(slug: string): string | undefined {
  return locationFacts.find((loc) => loc.slug === slug)?.city.split(",")[0];
}

/**
 * City + service pages from the CMS: the URL must name a known city and service, and a published
 * page needs its own local copy — not another city's text with the name swapped (doorway pages).
 */
async function contentPageProblem(values: Record<string, unknown>, recordId?: string): Promise<Problem | null> {
  const type = String(values.page_type ?? "");
  if (type === "case-study") return { error: "Case studies are added in the Case studies section, which fills the whole case-study template.", status: 422 };
  if (type !== "location-service") return null;

  const match = LOCATION_SERVICE_PATH.exec(String(values.slug ?? ""));
  const city = match ? cityName(match[1]) : undefined;
  if (!match || !city || !allThingsFreshTenant.services.some((service) => service.slug === match[2])) {
    const cities = locationFacts.map((loc) => loc.slug).join(", ");
    return { error: `Use a URL like /service-area/lakewood-oh/ceramic-coating, with a city (${cities}) and an existing service slug.`, status: 422 };
  }
  if (String(values.status ?? "") !== "published") return null;

  const intro = String(values.intro ?? "").trim();
  if (intro.length < LOCATION_SERVICE_MIN_INTRO) {
    return { error: `Write at least ${LOCATION_SERVICE_MIN_INTRO} characters of local detail in the intro before publishing.`, status: 422 };
  }
  const others = [
    ...locationServicePages.map((page) => ({ id: undefined, slug: `/service-area/${page.locationSlug}-oh/${page.serviceSlug}`, city: cityName(page.locationSlug ?? ""), intro: page.intro })),
    ...(await listRecords("content_pages", 500))
      .filter((row) => row.page_type === "location-service" && row.status === "published" && row.id !== recordId)
      .map((row) => {
        const other = LOCATION_SERVICE_PATH.exec(String(row.slug ?? ""));
        return { id: String(row.id), slug: String(row.slug), city: other ? cityName(other[1]) : undefined, intro: String(row.intro ?? "") };
      }),
  ].filter((other) => other.slug !== values.slug);
  for (const other of others) {
    const score = textSimilarity(intro, city, other.intro, other.city);
    if (score > LOCATION_SIMILARITY_LIMIT) {
      return { error: `This intro is ${Math.round(score * 100)}% the same as ${other.slug}. Give this city its own details before publishing.`, status: 422 };
    }
  }
  return null;
}

/** Invites cannot touch someone who already has access (roles change in the staff roster) or outrank the inviter. */
async function prepareInvite(profile: StaffProfile, role: StaffRole, email: string): Promise<Problem | null> {
  if (!canAssignRole(profile.role, role)) return { error: "Only a super admin can grant this role", status: 403 };
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const existing = await findProfileByEmail(admin, email);
  if (existing?.active) return { error: "This person already has access. Change their role in the staff list.", status: 409 };
  if (existing && !canAssignRole(profile.role, existing.role)) return { error: "Only a super admin can re-invite this person", status: 403 };
  if (existing) {
    // A previously deactivated account is banned; lift the ban so the invite can be accepted.
    const { error } = await admin.auth.admin.updateUserById(existing.id, { ban_duration: "none" });
    if (error) return { error: "Could not restore this account for sign-in", status: 502 };
  }
  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  const profile = await getStaffProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const resource = await contextResource(context);
  if (!resource) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  return NextResponse.json({ rows: await listRecords(resource, 250) });
}

export async function POST(request: Request, context: RouteContext) {
  const profile = await getStaffProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const resource = await contextResource(context);
  if (!resource) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const guard = writeGuard(profile, resource);
  if (guard) return problem(guard);

  const parsed = resourceCreateSchemas[resource].safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  let values: Record<string, unknown> = parsed.data;

  if (resource === "leads") {
    const lead = parsed.data as { name?: string; firstName?: string; lastName?: string; phone: string; email?: string; service?: string; requested_service?: string | null; source?: string; stage?: string };
    values = {
      name: lead.name || [lead.firstName, lead.lastName].filter(Boolean).join(" "),
      phone: lead.phone,
      email: lead.email || null,
      requested_service: lead.requested_service || lead.service || null,
      source: lead.source || "admin",
      stage: lead.stage || "new",
    };
  }
  if (resource === "redirects") {
    const redirect = await redirectProblem(String(values.source_path), String(values.destination_path));
    if (redirect) return problem(redirect);
  }
  if (resource === "notification_rules") {
    const ruleProblem = notificationRuleProblem(values);
    if (ruleProblem) return problem(ruleProblem);
  }
  if (resource === "case_studies" || resource === "content_pages") {
    const contentProblem = resource === "case_studies" ? await caseStudyProblem(values) : await contentPageProblem(values);
    if (contentProblem) return problem(contentProblem);
  }
  if (resource === "locations") {
    const { problem: duplicate, score } = await locationSimilarity(values);
    if (duplicate) return problem(duplicate);
    if (score !== null) values = { ...values, similarity_score: score };
  }
  if (resource === "staff_invites") {
    const invite = parsed.data as { email: string; role: StaffRole; expires_at?: string | null };
    const inviteProblem = await prepareInvite(profile, invite.role, invite.email);
    if (inviteProblem) return problem(inviteProblem);
    values = {
      email: invite.email,
      role: invite.role,
      invited_by: profile.id,
      expires_at: invite.expires_at || new Date(Date.now() + INVITE_TTL_MS).toISOString(),
    };
  }

  try {
    const row = await insertRecord(resource, values, profile.id);
    revalidatePublicContent(resource);
    return NextResponse.json({ row }, { status: 201 });
  } catch (error) {
    return problem(databaseProblem(error));
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const profile = await getStaffProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const resource = await contextResource(context);
  if (!resource) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const guard = writeGuard(profile, resource);
  if (guard) return problem(guard);

  const body = await readJson(request) as { id?: unknown; values?: unknown } | undefined;
  const recordId = recordIdSchema.safeParse(body?.id);
  if (!recordId.success) return NextResponse.json({ error: "A valid record id is required" }, { status: 422 });
  const parsed = resourceUpdateSchemas[resource].safeParse(body?.values);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", fields: parsed.error.flatten().fieldErrors }, { status: 422 });

  const existing = await findRecord(resource, recordId.data);
  if (!existing) return NextResponse.json({ error: "Record not found" }, { status: 404 });

  /**
   * A PATCH must only write the fields the caller actually sent. The update schemas come from
   * `.partial()`, but a field carrying `.default(...)` still emits that default when its key is
   * absent — so editing one field would silently overwrite others with their defaults (renaming a
   * service wiped its packages/inclusions/FAQs and a status change wiped a job's checklist).
   * Intersecting with the submitted keys keeps the rest untouched.
   */
  const submitted = new Set(Object.keys((body?.values ?? {}) as Record<string, unknown>));
  const values: Record<string, unknown> = Object.fromEntries(
    Object.entries(parsed.data as Record<string, unknown>).filter(([key]) => submitted.has(key)),
  );

  if (resource === "redirects") {
    const next = { ...existing, ...values };
    const redirect = await redirectProblem(String(next.source_path), String(next.destination_path), existing.id);
    if (redirect) return problem(redirect);
  }
  if (resource === "notification_rules") {
    const ruleProblem = notificationRuleProblem({ ...existing, ...values });
    if (ruleProblem) return problem(ruleProblem);
  }
  if (resource === "case_studies" || resource === "content_pages") {
    const merged = { ...existing, ...values };
    const contentProblem = resource === "case_studies" ? await caseStudyProblem(merged) : await contentPageProblem(merged, existing.id);
    if (contentProblem) return problem(contentProblem);
  }
  if (resource === "locations") {
    const merged = { ...existing, ...values };
    const { problem: duplicate, score } = await locationSimilarity(merged, existing.id);
    if (duplicate) return problem(duplicate);
    if (score !== null) values.similarity_score = score;
  }
  if (resource === "staff_invites") {
    if (existing.accepted_at) return NextResponse.json({ error: "Accepted invites cannot be changed. Update access in the staff list." }, { status: 409 });
    const nextRole = ((values as { role?: StaffRole }).role ?? existing.role) as StaffRole;
    if (!canAssignRole(profile.role, existing.role as StaffRole) || !canAssignRole(profile.role, nextRole)) {
      return NextResponse.json({ error: "Only a super admin can grant this role" }, { status: 403 });
    }
  }
  try {
    const row = await updateRecord(resource, recordId.data, values, profile.id);
    revalidatePublicContent(resource);
    return NextResponse.json({ row });
  } catch (error) {
    return problem(databaseProblem(error));
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const profile = await getStaffProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const resource = await contextResource(context);
  if (!resource) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const guard = writeGuard(profile, resource);
  if (guard) return problem(guard);

  const recordId = recordIdSchema.safeParse(new URL(request.url).searchParams.get("id"));
  if (!recordId.success) return NextResponse.json({ error: "A valid record id is required" }, { status: 422 });

  const existing = await findRecord(resource, recordId.data);
  if (!existing) return NextResponse.json({ error: "Record not found" }, { status: 404 });
  if (resource === "staff_invites" && existing.accepted_at) {
    return NextResponse.json({ error: "Accepted invites cannot be removed. Deactivate access in the staff list instead." }, { status: 409 });
  }

  try {
    await deleteRecord(resource, recordId.data, profile.id);
    revalidatePublicContent(resource);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return problem(databaseProblem(error, "delete"));
  }
}
