import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { StaffRole } from "./roles";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "all-things-fresh";

/** Supabase ban duration used for deactivated staff (~100 years). */
export const BAN_FOREVER = "876000h";

/** Whether access was granted, and whether doing so invalidated the caller's session. */
export interface ActivationResult {
  granted: boolean;
  sessionRevoked: boolean;
}

export interface StaffMember {
  id: string;
  email: string;
  role: StaffRole;
  active: boolean;
  deactivated_at: string | null;
  created_at: string;
  display_name?: string | null;
}

const STAFF_COLUMNS = "id, email, role, active, deactivated_at, created_at, display_name";

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isBootstrapEmail(email: string): boolean {
  const bootstrap = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  return Boolean(bootstrap) && email === bootstrap;
}

export async function findProfileByEmail(admin: SupabaseClient, email: string): Promise<StaffMember | null> {
  const { data, error } = await admin
    .from("profiles")
    .select(STAFF_COLUMNS)
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as StaffMember | null;
}

async function findValidInvite(admin: SupabaseClient, email: string): Promise<{ id: string; role: StaffRole } | null> {
  const { data, error } = await admin
    .from("staff_invites")
    .select("id, role, expires_at")
    .eq("tenant_id", TENANT_ID)
    .eq("email", email)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  const invite = (data ?? []).find((row) => !row.expires_at || Date.parse(row.expires_at) > Date.now());
  return invite ? { id: invite.id as string, role: invite.role as StaffRole } : null;
}

async function countActiveSuperAdmins(admin: SupabaseClient, excludeId?: string): Promise<number> {
  let query = admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "super_admin").eq("active", true);
  if (excludeId) query = query.neq("id", excludeId);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function hasAnotherActiveSuperAdmin(admin: SupabaseClient, excludeId: string): Promise<boolean> {
  return (await countActiveSuperAdmins(admin, excludeId)) > 0;
}

/** Whether a sign-in link may be sent. Mirrors activateStaff so links only go to people the callback will admit. */
export async function mayRequestSignIn(admin: SupabaseClient, email: string): Promise<boolean> {
  const profile = await findProfileByEmail(admin, email);
  if (profile?.active) return true;
  if (await findValidInvite(admin, email)) return true;
  if (!isBootstrapEmail(email)) return false;
  return (await countActiveSuperAdmins(admin)) === 0;
}

/**
 * Public signups are disabled, so the auth user for an invited or bootstrap
 * address is created here (inactive until the callback runs) before the
 * magic link is requested with shouldCreateUser: false.
 */
export async function ensureAuthUser(admin: SupabaseClient, email: string): Promise<void> {
  if (await findProfileByEmail(admin, email)) return;
  const { error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error && error.code !== "email_exists") throw error;
}

/**
 * Runs after the email owner has proven control of the address. Activates a
 * valid invite, or the bootstrap super admin while none exists. Invites never
 * change an already-active profile — that goes through the staff roster so an
 * invite cannot be used to demote someone.
 */
export async function activateStaff(admin: SupabaseClient, userId: string, email: string): Promise<ActivationResult> {
  const { data: profile, error } = await admin.from("profiles").select("id, active").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (profile?.active) return { granted: true, sessionRevoked: false };

  const invite = await findValidInvite(admin, email);
  let role: StaffRole | null = invite?.role ?? null;
  if (!role && isBootstrapEmail(email) && (await countActiveSuperAdmins(admin)) === 0) role = "super_admin";
  if (!role) return { granted: false, sessionRevoked: false };

  const { error: upsertError } = await admin
    .from("profiles")
    .upsert({ id: userId, email, role, active: true, deactivated_at: null }, { onConflict: "id" });
  if (upsertError) throw upsertError;
  // Anyone could have pre-registered this address with their own password before the
  // real owner proved control of it, so newly approved accounts start with no usable
  // password. Staff set their own under My account.
  //
  // Changing a password revokes every session for that user, including the one the caller
  // just created by exchanging the sign-in link. `sessionRevoked` tells the caller it has to
  // issue a fresh session, or the person who just proved they own the address is bounced
  // straight back to the login page.
  const { error: passwordError } = await admin.auth.admin.updateUserById(userId, { password: `${crypto.randomUUID()}${crypto.randomUUID()}` });
  if (passwordError) throw passwordError;
  if (invite) {
    await admin.from("staff_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);
  }
  await admin.from("audit_log").insert({
    actor: userId,
    action: invite ? "staff.invite_accepted" : "staff.bootstrap_super_admin",
    entity: "profiles",
    entity_id: userId,
    detail: { role },
  });
  return { granted: true, sessionRevoked: true };
}

/** Current and former staff. Accounts that were never granted access are not staff and are not listed. */
export async function listStaff(admin: SupabaseClient): Promise<StaffMember[]> {
  const { data, error } = await admin
    .from("profiles")
    .select(STAFF_COLUMNS)
    .or("active.eq.true,deactivated_at.not.is.null")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StaffMember[];
}
