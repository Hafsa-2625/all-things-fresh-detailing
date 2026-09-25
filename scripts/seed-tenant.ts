/**
 * Publishes a tenant's static config (src/tenant/tenants/*.ts) into the
 * `tenant_configs` table as the initial published row. Run once per tenant
 * after provisioning its Supabase project — see docs/architecture.md.
 *
 * Deliberately a script, not a SQL data migration: the tenant TS files are
 * already the validated source of truth (via tenantConfigSchema). Seeding
 * from SQL would mean maintaining the same data in two formats that could
 * drift; this script re-validates on every run instead.
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:tenant -- all-things-fresh
 */
import { createClient } from "@supabase/supabase-js";
import { tenantConfigSchema } from "../src/tenant/schema";
import { allThingsFreshTenant } from "../src/tenant/tenants/all-things-fresh";

const registry: Record<string, unknown> = {
  "all-things-fresh": allThingsFreshTenant,
};

async function main() {
  const slug = process.argv[2];
  if (!slug || !registry[slug]) {
    console.error(`Usage: seed-tenant.ts <tenant-slug>. Known: ${Object.keys(registry).join(", ")}`);
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set.");
    process.exit(1);
  }

  const config = tenantConfigSchema.parse(registry[slug]);
  const supabase = createClient(url, serviceKey);

  const { error } = await supabase.from("tenant_configs").insert({
    tenant_id: config.tenantId,
    status: "published",
    version: 1,
    config,
  });

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log(`Seeded and published "${slug}".`);
}

main();
