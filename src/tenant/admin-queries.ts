import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tenantConfigSchema, type TenantConfig } from "./schema";
import { getTenant } from "./get-tenant";

export interface TenantConfigRow {
  id: string;
  status: "draft" | "published";
  version: number;
  config: TenantConfig;
  updated_at: string;
}

/**
 * For the admin editor: the most recently touched row (draft if one is in
 * progress, otherwise the published one) so re-opening the editor resumes
 * where a staff member left off. Falls back to the static tenant + no row
 * (editing disabled) when there's no database — see the page component for
 * how that's surfaced to the user.
 */
export async function getLatestConfigForEditing(tenantId: string): Promise<{
  row: TenantConfigRow | null;
  config: TenantConfig;
}> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { row: null, config: await getTenant() };
  }

  const { data } = await supabase
    .from("tenant_configs")
    .select("id, status, version, config, updated_at")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return { row: null, config: await getTenant() };
  }

  return {
    row: data as TenantConfigRow,
    config: tenantConfigSchema.parse(data.config),
  };
}
