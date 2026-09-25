import { NextResponse } from "next/server";
import { z } from "zod";
import { canAssignRole, canManageStaff, getStaffProfile, STAFF_ROLES } from "@/lib/admin/session";
import { BAN_FOREVER, hasAnotherActiveSuperAdmin, listStaff, type StaffMember } from "@/lib/admin/staff-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const STAFF_COLUMNS = "id, email, role, active, deactivated_at, created_at";

const patchSchema = z
  .object({
    id: z.string().uuid(),
    role: z.enum(STAFF_ROLES).optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => value.role !== undefined || value.active !== undefined, { message: "Nothing to change" });

export async function GET() {
  const profile = await getStaffProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ rows: [] });
  return NextResponse.json({ rows: await listStaff(admin) });
}

/** Changes an existing staff member's role or activation. Deactivation also bans the auth user. */
export async function PATCH(request: Request) {
  const profile = await getStaffProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageStaff(profile.role)) return NextResponse.json({ error: "Admin role required to manage staff" }, { status: 403 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Supabase is not connected" }, { status: 503 });

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  const { id, role, active } = parsed.data;

  if (id === profile.id) return NextResponse.json({ error: "You cannot change your own access" }, { status: 403 });

  const { data: target, error: readError } = await admin.from("profiles").select(STAFF_COLUMNS).eq("id", id).maybeSingle<StaffMember>();
  if (readError) return NextResponse.json({ error: "Could not load this staff member" }, { status: 500 });
  if (!target) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  if (!target.active && !target.deactivated_at) {
    return NextResponse.json({ error: "This account was never given access. Send an invite instead." }, { status: 409 });
  }
  if (!canAssignRole(profile.role, target.role) || (role && !canAssignRole(profile.role, role))) {
    return NextResponse.json({ error: "Only a super admin can change admin-level access" }, { status: 403 });
  }

  const removesSuperAdmin = target.role === "super_admin" && target.active && ((role !== undefined && role !== "super_admin") || active === false);
  if (removesSuperAdmin && !(await hasAnotherActiveSuperAdmin(admin, target.id))) {
    return NextResponse.json({ error: "Keep at least one active super admin" }, { status: 409 });
  }

  const { data: row, error: updateError } = await admin
    .from("profiles")
    .update({
      ...(role !== undefined ? { role } : {}),
      ...(active !== undefined ? { active, deactivated_at: active ? null : new Date().toISOString() } : {}),
    })
    .eq("id", id)
    .select(STAFF_COLUMNS)
    .single<StaffMember>();
  if (updateError) return NextResponse.json({ error: "Could not update access" }, { status: 500 });

  if (active !== undefined && active !== target.active) {
    const { error: banError } = await admin.auth.admin.updateUserById(id, { ban_duration: active ? "none" : BAN_FOREVER });
    if (banError) {
      console.error("[admin/staff] auth ban state could not be updated", banError);
      if (active) return NextResponse.json({ error: "Access restored, but sign-in could not be re-enabled. Try again." }, { status: 502 });
    }
  }

  await admin.from("audit_log").insert({
    actor: profile.id,
    action: "staff.access_changed",
    entity: "profiles",
    entity_id: id,
    detail: { from: { role: target.role, active: target.active }, to: { role: row.role, active: row.active } },
  });

  return NextResponse.json({ row });
}
