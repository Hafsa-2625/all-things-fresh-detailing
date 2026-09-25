import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const memory = new Map<string, { hits: number; resetAt: number }>();
const MEMORY_LIMIT = 10_000;

/**
 * Client address as reported by the hosting proxy. Only trustworthy when the
 * app sits behind a proxy that overwrites X-Forwarded-For (Vercel, Cloudflare,
 * a configured load balancer).
 */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function memoryHit(key: string, windowSeconds: number, max: number): RateLimitResult {
  const now = Date.now();
  const current = memory.get(key);
  if (!current || current.resetAt <= now) {
    if (memory.size >= MEMORY_LIMIT) memory.clear();
    memory.set(key, { hits: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: max >= 1, retryAfterSeconds: windowSeconds };
  }
  current.hits += 1;
  return { allowed: current.hits <= max, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}

/**
 * Fixed-window limiter shared by every server instance through the
 * `rate_limit_hit` database function. Falls back to a per-instance counter
 * when the database is not configured or unreachable, so a database outage
 * never takes the public forms down.
 */
export async function rateLimit(key: string, windowSeconds: number, max: number): Promise<RateLimitResult> {
  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase.rpc("rate_limit_hit", { p_key: key, p_window_seconds: windowSeconds, p_max: max });
    if (!error && data && typeof data === "object") {
      const result = data as { allowed?: unknown; retry_after?: unknown };
      return { allowed: result.allowed === true, retryAfterSeconds: Number(result.retry_after) || windowSeconds };
    }
    console.error("[rate-limit] shared limiter unavailable; using per-instance fallback", error?.message);
  }
  return memoryHit(key, windowSeconds, max);
}
