import "server-only";
import { cache } from "react";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { tenantConfigSchema, type TenantConfig } from "./schema";
import { allThingsFreshTenant } from "./tenants/all-things-fresh";

const staticRegistry: Record<string, TenantConfig> = {
  "all-things-fresh": allThingsFreshTenant,
};

function getStaticTenant(tenantId: string): TenantConfig {
  const tenant = staticRegistry[tenantId];
  if (!tenant) {
    throw new Error(
      `Unknown tenant "${tenantId}". Known tenants: ${Object.keys(staticRegistry).join(", ")}`,
    );
  }
  return tenantConfigSchema.parse(tenant);
}

/**
 * Resolves the active tenant's PUBLISHED config from `tenant_configs`, falling
 * back to the static registry when no database is configured, nothing is
 * published yet, or the read fails, so the public site never goes down because
 * of a database problem. Every result is re-validated against tenantConfigSchema.
 *
 * Published config is public data, so this uses a cookie-less anon client. An
 * earlier version used the cookie-based server client: reading cookies made every
 * public page dynamic, and during static generation Next's dynamic-usage signal
 * was caught here, so prerendered pages always ignored the published config.
 * Publishing from /admin/website revalidates the pages instead.
 *
 * Cached per request: layouts, pages and metadata all call this.
 */
export const getTenant = cache(async (): Promise<TenantConfig> => {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || "all-things-fresh";
  const supabase = createPublicSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("tenant_configs")
        .select("config")
        .eq("tenant_id", tenantId)
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn(`[tenant] DB read failed, falling back to static config: ${error.message}`);
      } else if (data) {
        const parsed = tenantConfigSchema.safeParse(data.config);
        if (parsed.success) return parsed.data;
        console.warn("[tenant] Published config is invalid, falling back to static config:", parsed.error.message);
      }
    } catch (err) {
      console.warn("[tenant] DB read threw, falling back to static config:", err);
    }
  }

  return getStaticTenant(tenantId);
});
