"use server";

import { getStaffProfile } from "@/lib/admin/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/security/rate-limit";

export interface PasswordActionState {
  status: "idle" | "saved" | "error";
  message?: string;
}

const MIN_LENGTH = 10;

/** Lets a signed-in, approved staff member set or change their own password. */
export async function setPassword(_prevState: PasswordActionState, formData: FormData): Promise<PasswordActionState> {
  const profile = await getStaffProfile();
  if (!profile) return { status: "error", message: "Your session has ended. Sign in again." };

  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  if (password.length < MIN_LENGTH || password.length > 128) {
    return { status: "error", message: `Use between ${MIN_LENGTH} and 128 characters.` };
  }
  if (password !== confirm) return { status: "error", message: "The passwords do not match." };

  const limit = await rateLimit(`admin-password:${profile.id}`, 15 * 60, 5);
  if (!limit.allowed) return { status: "error", message: "Too many attempts. Try again in a few minutes." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase!.auth.updateUser({ password });
  if (error) {
    console.error("[admin/account] password could not be set", error.message);
    return { status: "error", message: error.code === "weak_password" || error.code === "same_password" ? error.message : "Your password could not be saved. Try again shortly." };
  }

  await createSupabaseAdminClient()?.from("audit_log").insert({
    actor: profile.id,
    action: "staff.password_set",
    entity: "profiles",
    entity_id: profile.id,
    detail: {},
  });
  return { status: "saved", message: "Password saved. You can now sign in with your email and password." };
}
