import type { Locale } from "./schema";
import { allThingsFreshTenant } from "./tenants/all-things-fresh";

/**
 * Deliberately static, deliberately synchronous. `proxy.ts` runs on every
 * request on the Edge runtime and only needs "which locales, which default"
 * to route correctly — it must not do a database round-trip for that (adds
 * latency to every navigation, and an outage here would break the whole
 * site's routing). The full tenantConfig used to render pages is DB-backed
 * with this same static data as its fallback; see get-tenant.ts.
 */
export function getTenantLocaleConfig(): { enabled: Locale[]; default: Locale } {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || "all-things-fresh";
  const registry = { "all-things-fresh": allThingsFreshTenant } as const;
  const tenant = registry[tenantId as keyof typeof registry] ?? allThingsFreshTenant;
  return { enabled: tenant.languages.enabled, default: tenant.languages.default };
}
