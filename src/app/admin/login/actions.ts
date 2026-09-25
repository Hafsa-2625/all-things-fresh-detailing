"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureAuthUser, findProfileByEmail, mayRequestSignIn, normalizeEmail } from "@/lib/admin/staff-access";
import { rateLimit } from "@/lib/security/rate-limit";

export interface LoginActionState {
  status: "idle" | "sent" | "error";
  message?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BAD_CREDENTIALS: LoginActionState = { status: "error", message: "Email or password is incorrect, or this account is not approved." };

/**
 * Staff sign in with a password or an emailed magic link — the submit button
 * that was pressed ("intent") picks which. Both only ever admit approved
 * people: an active staff profile, a valid invite (magic link only, since an
 * invitee has no password yet), or the bootstrap admin while none exists.
 *
 * Responses never reveal whether an address has access, so the form cannot
 * be used to discover staff emails.
 */
export async function signIn(_prevState: LoginActionState, formData: FormData): Promise<LoginActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "No database is connected yet — see docs/architecture.md." };
  }

  const email = normalizeEmail(String(formData.get("email") || ""));
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return { status: "error", message: "Secure staff sign-in needs the server-only Supabase service key." };

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const [byIp, byEmail] = await Promise.all([
    rateLimit(`admin-login:ip:${ip}`, 15 * 60, 20),
    rateLimit(`admin-login:email:${email}`, 15 * 60, 5),
  ]);
  if (!byIp.allowed || !byEmail.allowed) {
    return { status: "error", message: "Too many sign-in attempts. Try again in a few minutes." };
  }

  if (formData.get("intent") === "link") return sendMagicLink(admin, email);
  return signInWithPassword(admin, email, String(formData.get("password") || ""));
}

async function signInWithPassword(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  email: string,
  password: string,
): Promise<LoginActionState> {
  if (!password) return { status: "error", message: "Enter your password, or email yourself a magic link." };
  if (password.length > 128) return BAD_CREDENTIALS;

  const supabase = await createSupabaseServerClient();
  try {
    // Checked before authenticating so unapproved accounts never get a session cookie.
    const profile = await findProfileByEmail(admin, email);
    if (!profile?.active) return BAD_CREDENTIALS;

    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error || !data.user) return BAD_CREDENTIALS;

    const { data: active, error: activeError } = await admin
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .eq("active", true)
      .maybeSingle();
    if (activeError) throw activeError;
    if (!active) {
      await supabase!.auth.signOut();
      return BAD_CREDENTIALS;
    }
  } catch (error) {
    console.error("[admin/login] password sign-in failed", error);
    return { status: "error", message: "Sign-in is temporarily unavailable. Try again shortly." };
  }

  redirect("/admin");
}

async function sendMagicLink(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  email: string,
): Promise<LoginActionState> {
  const sent: LoginActionState = {
    status: "sent",
    message: `If ${email} is approved for the operations console, a magic link is on its way.`,
  };

  try {
    if (!(await mayRequestSignIn(admin, email))) {
      if (!process.env.ADMIN_BOOTSTRAP_EMAIL) console.warn("[admin/login] ADMIN_BOOTSTRAP_EMAIL is not set; no first administrator can sign in.");
      return sent;
    }
    await ensureAuthUser(admin, email);

    const supabase = await createSupabaseServerClient();
    // NEXT_PUBLIC_SITE_URL is inlined at build time, so a deployment built before it was set would
    // otherwise email people a localhost link. VERCEL_URL is injected per deployment at runtime and
    // covers that case, including preview builds. Supabase still only honours a redirect that is on
    // the project's allow-list, so this cannot be pointed somewhere arbitrary.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
      || "http://localhost:3000";
    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl}/admin/auth/callback` },
    });
    if (error) throw error;
  } catch (error) {
    console.error("[admin/login] magic link could not be sent", error);
    return { status: "error", message: "Sign-in is temporarily unavailable. Try again shortly." };
  }

  return sent;
}
