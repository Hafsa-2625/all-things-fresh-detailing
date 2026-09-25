/**
 * Whether a real Supabase project is wired up. False for this build — no
 * project is provisioned yet (see docs/architecture.md, "Awaiting
 * credentials"). Every caller in this file checks this first and falls
 * back gracefully rather than throwing, so the public site and the /admin
 * shell both keep working — just without live data — until a project
 * exists.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
