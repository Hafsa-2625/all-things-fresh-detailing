/**
 * Makes an email an active super admin with a password, creating the auth
 * user if needed. Optionally deactivates (and bans) a previous super admin.
 * Prints the password once; it is not stored anywhere else.
 *
 * Usage:
 *   npm run admin:super -- admin@allthingsfresh.com [--replace old@example.com]
 *
 * Set ADMIN_PASSWORD to choose the password; otherwise a random one is generated.
 */
import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BAN_FOREVER = "876000h";

async function findUserId(supabase: SupabaseClient, email: string): Promise<string | null> {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 200) return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const email = args[0]?.trim().toLowerCase();
  const replaceIndex = args.indexOf("--replace");
  const replace = replaceIndex >= 0 ? args[replaceIndex + 1]?.trim().toLowerCase() : undefined;
  if (!email || email.startsWith("--") || (replaceIndex >= 0 && !replace)) {
    console.error("Usage: set-super-admin.ts <email> [--replace <old-email>]");
    process.exit(1);
  }
  if (replace === email) {
    console.error("--replace must be a different email.");
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set.");
    process.exit(1);
  }

  const password = process.env.ADMIN_PASSWORD || randomBytes(15).toString("base64url");
  if (password.length < 10 || password.length > 128) {
    console.error("ADMIN_PASSWORD must be 10–128 characters.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  let userId = await findUserId(supabase, email);
  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true, ban_duration: "none" });
    if (error) throw error;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    userId = data.user.id;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, email, role: "super_admin", active: true, deactivated_at: null }, { onConflict: "id" });
  if (profileError) throw profileError;
  await supabase.from("audit_log").insert({ actor: userId, action: "staff.super_admin_set_by_script", entity: "profiles", entity_id: userId, detail: { role: "super_admin" } });

  if (replace) {
    const { data: old, error } = await supabase.from("profiles").select("id").eq("email", replace);
    if (error) throw error;
    for (const { id } of old ?? []) {
      const { error: deactivateError } = await supabase.from("profiles").update({ active: false, deactivated_at: new Date().toISOString() }).eq("id", id);
      if (deactivateError) throw deactivateError;
      const { error: banError } = await supabase.auth.admin.updateUserById(id, { ban_duration: BAN_FOREVER });
      if (banError) throw banError;
      await supabase.from("audit_log").insert({ actor: userId, action: "staff.deactivated_by_script", entity: "profiles", entity_id: id, detail: { email: replace } });
    }
    console.log(old?.length ? `Deactivated ${replace}.` : `No staff profile found for ${replace}; nothing to deactivate.`);
  }

  console.log(`\n${email} is now an active super admin.`);
  if (!process.env.ADMIN_PASSWORD) console.log(`Password: ${password}\nSave it in a password manager now — it is not stored anywhere else.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
