-- Security hardening (docs/PROD_READINESS_CHECKLIST.md §1). Run after 0002_operations_crm_cms.sql.
--
-- Deploy order: apply this migration BEFORE deploying the matching application code. The app now
-- requires profiles.active, and without this migration no staff member can sign in.

-- ---------------------------------------------------------------------------
-- 1. Staff access is opt-in
-- ---------------------------------------------------------------------------
-- Previously every auth.users row received an editor profile and every profile counted as staff,
-- so anyone calling supabase.auth.signUp with the public anon key could read all CRM data through
-- the REST API. A profile is now inactive until /admin/auth/callback proves the email owner holds
-- a valid invite (or is ADMIN_BOOTSTRAP_EMAIL while no active super admin exists).
alter table public.profiles add column if not exists active boolean not null default false;
-- Set when staff access is removed. Distinguishes deactivated staff (who may be reactivated) from
-- accounts that were never granted access (who must be invited instead).
alter table public.profiles add column if not exists deactivated_at timestamptz;

-- Emails are compared exactly in lower case. ILIKE treats "_" and "%" as wildcards, which let one
-- address match another person's invite.
update public.profiles set email = lower(email) where email <> lower(email);
update public.staff_invites set email = lower(trim(email)) where email <> lower(trim(email));
alter table public.staff_invites
  add constraint staff_invites_email_lowercase check (email = lower(email)) not valid;
create index if not exists staff_invites_pending_email_idx
  on public.staff_invites (tenant_id, email) where accepted_at is null;
create index if not exists profiles_email_idx on public.profiles (email);

-- Existing deployments keep access only for profiles that already held a granted role or an
-- accepted invite. Self-registered editor profiles stay inactive.
update public.profiles p
set active = true
where p.role in ('super_admin', 'admin', 'manager')
   or exists (select 1 from public.staff_invites i where i.email = p.email and i.accepted_at is not null);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, active)
  values (new.id, lower(coalesce(new.email, '')), 'editor', false)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

create or replace function public.has_staff_role(allowed public.staff_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active and role = any(allowed));
$$;

-- Roster visible to active staff only. There is no update policy: role and activation changes go
-- through /api/admin/staff, which enforces who may grant what and writes the audit log.
drop policy if exists "profiles are readable by any staff member" on public.profiles;
drop policy if exists "super_admin can update any profile" on public.profiles;
create policy profiles_staff_read on public.profiles
  for select to authenticated using (public.is_staff());

drop policy if exists "staff can read all configs including drafts" on public.tenant_configs;
drop policy if exists "manager and above can write tenant config" on public.tenant_configs;
drop policy if exists "manager and above can update tenant config" on public.tenant_configs;
create policy tenant_configs_staff_read on public.tenant_configs
  for select to authenticated using (public.is_staff());
create policy tenant_configs_manager_insert on public.tenant_configs
  for insert to authenticated
  with check (public.has_staff_role(array['super_admin','admin','manager']::public.staff_role[]) and updated_by = auth.uid());
create policy tenant_configs_manager_update on public.tenant_configs
  for update to authenticated
  using (public.has_staff_role(array['super_admin','admin','manager']::public.staff_role[]))
  with check (public.has_staff_role(array['super_admin','admin','manager']::public.staff_role[]));

drop policy if exists "staff can read the audit log" on public.audit_log;
drop policy if exists "staff can write their own audit entries" on public.audit_log;
create policy audit_log_staff_read on public.audit_log
  for select to authenticated using (public.is_staff());
create policy audit_log_staff_insert on public.audit_log
  for insert to authenticated with check (public.is_staff() and actor = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. Redirects stay on this site
-- ---------------------------------------------------------------------------
-- "//evil.example" starts with "/" but browsers treat it as another host.
alter table public.redirects
  add constraint redirects_internal_destination
  check (destination_path ~ '^/([^/\\]|$)' and destination_path !~ '[[:space:][:cntrl:]\\]') not valid;
alter table public.redirects
  add constraint redirects_not_self check (source_path <> destination_path) not valid;

-- Hit counts are written by the server with the service role; anonymous callers could inflate them.
revoke all on function public.record_redirect_hit(text, text) from public, anon, authenticated;
grant execute on function public.record_redirect_hit(text, text) to service_role;

-- ---------------------------------------------------------------------------
-- 3. Shared rate limiting for public endpoints
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);
alter table public.rate_limits enable row level security;

create or replace function public.rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  current_hits integer;
  started timestamptz;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when r.window_start <= now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
    window_start = case when r.window_start <= now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits, window_start into current_hits, started;

  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return jsonb_build_object(
    'allowed', current_hits <= p_max,
    'retry_after', greatest(1, ceil(extract(epoch from (started + make_interval(secs => p_window_seconds) - now())))::integer)
  );
end;
$$;
revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- 4. Media bucket
-- ---------------------------------------------------------------------------
-- Website imagery is public by nature, so objects are publicly readable. There are no storage.objects
-- policies for this bucket: listing and uploads are only possible through the service-role upload
-- route, which verifies file contents. SVG is excluded because it can carry script.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('atf-media', 'atf-media', true, 12582912,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on table public.media_assets is
  'Metadata for objects in the public atf-media bucket. Uploads only via /api/admin/media (content-sniffed, no SVG).';
