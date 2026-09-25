-- CMS foundation: staff accounts/roles, versioned tenant config, audit log.
-- Not applied yet — no Supabase project is provisioned for this build (see
-- docs/architecture.md, "Awaiting credentials"). Written and reviewed ahead
-- of time so provisioning a project is "run these migrations", not "design
-- the schema under time pressure."

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
create type public.staff_role as enum ('super_admin', 'admin', 'manager', 'editor');

-- One row per authenticated staff member. Public site visitors never get a
-- row here — this table is exclusively for people with access to /admin.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.staff_role not null default 'editor',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Staff can see the roster (needed to know who else has access); only the
-- row owner or a super_admin can change a role.
create policy "profiles are readable by any staff member"
  on public.profiles for select
  to authenticated
  using (true);

create policy "super_admin can update any profile"
  on public.profiles for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));

-- Every new auth account starts as editor. The application promotes only the
-- configured ADMIN_BOOTSTRAP_EMAIL after a successful callback when no super
-- admin exists. This avoids letting an arbitrary first direct Supabase signup
-- claim the highest role.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    'editor'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Tenant configuration (draft / published, versioned)
-- ---------------------------------------------------------------------------
create type public.tenant_config_status as enum ('draft', 'published');

create table public.tenant_configs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  status public.tenant_config_status not null default 'draft',
  version integer not null default 1,
  config jsonb not null,
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Public site reads (server-side, via the anon key under RLS) only ever see
-- the single published row per tenant — drafts are staff-only. This means
-- the live site NEVER needs the service-role key, only anon + RLS.
create index tenant_configs_tenant_status_idx on public.tenant_configs (tenant_id, status);

alter table public.tenant_configs enable row level security;

create policy "anyone can read the published config"
  on public.tenant_configs for select
  to anon, authenticated
  using (status = 'published');

create policy "staff can read all configs including drafts"
  on public.tenant_configs for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid()));

-- Editors can view but not change business/booking/integration config —
-- writes are restricted to manager and above (Section 40 of the brief).
create policy "manager and above can write tenant config"
  on public.tenant_configs for insert
  to authenticated
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('super_admin', 'admin', 'manager')
  ));

create policy "manager and above can update tenant config"
  on public.tenant_configs for update
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('super_admin', 'admin', 'manager')
  ));

create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenant_configs_set_updated_at
  before update on public.tenant_configs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid references public.profiles (id),
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "staff can read the audit log"
  on public.audit_log for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid()));

create policy "staff can write their own audit entries"
  on public.audit_log for insert
  to authenticated
  with check (actor = auth.uid());
