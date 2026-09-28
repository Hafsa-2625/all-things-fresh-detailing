/**
 * An in-memory Postgres (PGlite) with every migration in supabase/migrations applied, so database
 * rules — generated columns, triggers, RLS, grants — are tested against real Postgres without
 * Docker or a Supabase project. Only the pieces Supabase normally provides are stubbed: the API
 * roles, their default grants, auth.users / auth.uid() and storage.buckets.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const SUPABASE_STUBS = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
`;

export async function migratedDatabase(): Promise<PGlite> {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(SUPABASE_STUBS);
  const dir = join(process.cwd(), "supabase", "migrations");
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(dir, file), "utf8"));
  }
  return db;
}

/** Runs `work` as a Supabase API role: `anon`, or `authenticated` signed in as `userId`. */
export async function asRole<T>(db: PGlite, role: "anon" | "authenticated", userId: string | null, work: () => Promise<T>): Promise<T> {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
  await db.exec(`set role ${role}`);
  try {
    return await work();
  } finally {
    await db.exec("reset role");
  }
}
