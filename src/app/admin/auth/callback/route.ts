import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { activateStaff, normalizeEmail } from "@/lib/admin/staff-access";

/**
 * Exchanges the magic-link code for a session, activates the staff profile if
 * the address holds a valid invite (or is the bootstrap admin), then lands on
 * the dashboard. Anyone else is signed straight back out.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const denied = () => NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url));

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!code || !supabase || !admin) return denied();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  const user = data.user;
  if (error || !user?.email) {
    // Usually an expired link, or one opened in a different browser from the one that requested it.
    console.warn("[admin/auth] sign-in link could not be exchanged", error?.message);
    return denied();
  }

  const address = normalizeEmail(user.email);
  let activation = { granted: false, sessionRevoked: false };
  try {
    activation = await activateStaff(admin, user.id, address);
  } catch (activationError) {
    console.error("[admin/auth] staff activation failed", activationError);
  }
  if (!activation.granted) {
    await supabase.auth.signOut();
    return denied();
  }

  // Approving an account wipes any password it already had, and that revokes every session for
  // the user — including the one exchangeCodeForSession just issued. Without replacing it, a
  // first sign-in always lands back on the login page even though access was granted.
  if (activation.sessionRevoked) {
    try {
      const { data: fresh, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: address });
      const tokenHash = fresh?.properties?.hashed_token;
      // generateLink only mints the token, it does not email anything.
      if (linkError || !tokenHash) throw linkError ?? new Error("no token returned");
      const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
      if (verifyError) throw verifyError;
    } catch (sessionError) {
      console.error("[admin/auth] could not re-establish the session after activation", sessionError);
      return NextResponse.redirect(new URL("/admin/login?error=retry", request.url));
    }
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}
