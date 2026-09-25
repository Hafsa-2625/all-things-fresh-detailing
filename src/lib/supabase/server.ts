import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./config";

/**
 * Server-side Supabase client (RSC/Server Actions/Route Handlers only). Uses
 * the anon key + RLS — every table this app touches is designed so the
 * public site never needs the service-role key (see the migration comments
 * in supabase/migrations/0001_cms_foundation.sql). Returns null when no
 * project is configured; callers must handle that rather than assume a
 * client always exists.
 *
 * Note: session refresh normally happens in proxy/middleware on every
 * request. This app's proxy.ts deliberately stays database-free (locale
 * routing only — see its file comment), so long-lived admin sessions may
 * need a re-login sooner than the Supabase default. Acceptable for an
 * internal admin tool; revisit if that proves annoying in practice.
 */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render, where cookies can't be
            // written. Safe to ignore — the Server Action / Route Handler
            // path that actually authenticates the visitor can write them.
          }
        },
      },
    },
  );
}
