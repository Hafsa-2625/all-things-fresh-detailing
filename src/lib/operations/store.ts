import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ResourceName } from "./schemas";

export type StoredRecord = Record<string, unknown> & { id: string; created_at: string; updated_at: string };
type LocalStore = Partial<Record<string, StoredRecord[]>>;

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "all-things-fresh";
const localPath = process.env.ATF_LOCAL_DB_PATH || join(process.cwd(), ".data", "atf-local-store.json");

function localModeAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ATF_ALLOW_LOCAL_STORE === "true";
}

async function readLocal(): Promise<LocalStore> {
  if (!localModeAllowed()) throw new Error("Supabase is not configured and production local storage is disabled");
  try {
    return JSON.parse(await readFile(/* turbopackIgnore: true */ localPath, "utf8")) as LocalStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

async function writeLocal(store: LocalStore): Promise<void> {
  await mkdir(dirname(localPath), { recursive: true });
  const temporary = `${localPath}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(store, null, 2), "utf8");
  await rename(temporary, localPath);
}

function belongsToTenant(row: StoredRecord): boolean {
  return (row.tenant_id ?? TENANT_ID) === TENANT_ID;
}

async function audit(actorId: string | null, action: string, entity: string, entityId: string, detail: unknown) {
  const supabase = createSupabaseAdminClient();
  if (supabase) {
    await supabase.from("audit_log").insert({ actor: actorId, action, entity, entity_id: entityId, detail });
    return;
  }
  const store = await readLocal();
  const now = new Date().toISOString();
  const row: StoredRecord = { id: randomUUID(), actor: actorId, action, entity, entity_id: entityId, detail, created_at: now, updated_at: now };
  store.audit_log = [row, ...(store.audit_log ?? [])];
  await writeLocal(store);
}

export async function listRecords(resource: ResourceName, limit = 100): Promise<StoredRecord[]> {
  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase.from(resource).select("*").eq("tenant_id", TENANT_ID).order("created_at", { ascending: false }).limit(Math.min(limit, 500));
    if (error) throw error;
    return (data ?? []) as StoredRecord[];
  }
  const store = await readLocal();
  return (store[resource] ?? []).filter(belongsToTenant).slice(0, Math.min(limit, 500));
}

/** Rows whose `column` equals `value`, newest first. Queried directly rather than filtering a capped list. */
export async function listRecordsBy(resource: ResourceName, column: string, value: string, limit = 500): Promise<StoredRecord[]> {
  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase.from(resource).select("*").eq("tenant_id", TENANT_ID).eq(column, value).order("created_at", { ascending: false }).limit(Math.min(limit, 1000));
    if (error) throw error;
    return (data ?? []) as StoredRecord[];
  }
  const store = await readLocal();
  return (store[resource] ?? []).filter((row) => belongsToTenant(row) && row[column] === value).slice(0, Math.min(limit, 1000));
}

export async function findRecordBy(resource: ResourceName, column: string, value: string): Promise<StoredRecord | null> {
  return (await listRecordsBy(resource, column, value, 1))[0] ?? null;
}

export async function findRecord(resource: ResourceName, recordId: string): Promise<StoredRecord | null> {
  return findRecordBy(resource, "id", recordId);
}

export async function insertRecord(resource: ResourceName, values: Record<string, unknown>, actorId: string | null = null): Promise<StoredRecord> {
  const now = new Date().toISOString();
  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase.from(resource).insert({ ...values, tenant_id: TENANT_ID }).select("*").single();
    if (error) throw error;
    await audit(actorId, "create", resource, String(data.id), values);
    return data as StoredRecord;
  }
  const store = await readLocal();
  const row = { id: randomUUID(), ...values, tenant_id: TENANT_ID, created_at: now, updated_at: now } as StoredRecord;
  store[resource] = [row, ...(store[resource] ?? [])];
  await writeLocal(store);
  await audit(actorId, "create", resource, row.id, values);
  return row;
}

export async function updateRecord(resource: ResourceName, recordId: string, values: Record<string, unknown>, actorId: string | null): Promise<StoredRecord> {
  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase.from(resource).update(values).eq("tenant_id", TENANT_ID).eq("id", recordId).select("*").single();
    if (error) throw error;
    await audit(actorId, "update", resource, recordId, values);
    return data as StoredRecord;
  }
  const store = await readLocal();
  const rows = store[resource] ?? [];
  const index = rows.findIndex((row) => row.id === recordId && belongsToTenant(row));
  if (index < 0) throw new Error("Record not found");
  rows[index] = { ...rows[index], ...values, updated_at: new Date().toISOString() } as StoredRecord;
  store[resource] = rows;
  await writeLocal(store);
  await audit(actorId, "update", resource, recordId, values);
  return rows[index];
}

export async function deleteRecord(resource: ResourceName, recordId: string, actorId: string | null): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const { error, count } = await supabase.from(resource).delete({ count: "exact" }).eq("tenant_id", TENANT_ID).eq("id", recordId);
    if (error) throw error;
    if (!count) throw new Error("Record not found");
    await audit(actorId, "delete", resource, recordId, null);
    return;
  }
  const store = await readLocal();
  const rows = store[resource] ?? [];
  const index = rows.findIndex((row) => row.id === recordId && belongsToTenant(row));
  if (index < 0) throw new Error("Record not found");
  rows.splice(index, 1);
  store[resource] = rows;
  await writeLocal(store);
  await audit(actorId, "delete", resource, recordId, null);
}

export async function resourceCounts(resources: ResourceName[]): Promise<Record<ResourceName, number>> {
  const result = {} as Record<ResourceName, number>;
  const supabase = createSupabaseAdminClient();
  if (supabase) {
    // Count on the database instead of downloading every row just to measure the list.
    await Promise.all(resources.map(async (resource) => {
      const { count, error } = await supabase.from(resource).select("id", { count: "exact", head: true }).eq("tenant_id", TENANT_ID);
      if (error) throw error;
      result[resource] = count ?? 0;
    }));
    return result;
  }
  const store = await readLocal();
  for (const resource of resources) result[resource] = (store[resource] ?? []).filter(belongsToTenant).length;
  return result;
}
