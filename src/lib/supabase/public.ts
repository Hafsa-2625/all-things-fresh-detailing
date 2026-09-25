import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** How long a published-content read is reused before the next render fetches it again. */
export const PUBLIC_CONTENT_REVALIDATE_SECONDS = 60;

/**
 * Anon client for published content on public pages (RLS limits it to published rows).
 *
 * Every request carries an explicit revalidate window. Without one, Next reused fetch results
 * from `.next/cache` across builds — a build after a database change rendered the old data, and
 * hosts such as Vercel restore that cache between deployments. A time window keeps pages
 * prerendered while guaranteeing they pick up changes; admin saves also revalidate immediately.
 */
export function createPublicSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, next: { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS, tags: ["public-content"] } }),
    },
  });
}
