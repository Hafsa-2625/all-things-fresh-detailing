import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { StaffRole } from "./roles";

export { STAFF_ROLES, ROLE_RANK, canAssignRole, canManageStaff, canWrite, type StaffRole } from "./roles";

export interface StaffProfile {
  id: string;
  email: string;
  role: StaffRole;
}

/**
 * Returns the signed-in, active staff member, or null if unauthenticated / inactive / no DB configured.
 * Memoised per request, so the admin layout and the page share one auth round trip instead of each making their own.
 */
export const getStaffProfile = cache(async (): Promise<StaffProfile | null> => {
  // Access must be decided per request. Without this, a build that lacks
  // Supabase env vars prerenders admin pages as static output.
  await connection();

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS already hides profiles from inactive accounts; the explicit filter keeps
  // that true even if a policy is loosened later.
  const { data } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .eq("active", true)
    .maybeSingle();
  return (data as StaffProfile | null) ?? null;
});

/**
 * Redirects to /admin/login if unauthenticated. Does NOT enforce a minimum
 * role — a page that's visible to every staff role but has manager-gated
 * actions (like the Website editor) should call this, then use `canWrite`
 * to disable just those actions, rather than locking editors out of the
 * whole page.
 */
export async function requireStaff(): Promise<StaffProfile> {
  const profile = await getStaffProfile();
  if (!profile) redirect("/admin/login");
  return profile;
}
