-- Operational schema for the ATF admin: CRM, scheduling, locked-design CMS
-- records, media, redirects and alerts.
-- Run after 0001_cms_foundation.sql.

create extension if not exists pgcrypto;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

create or replace function public.has_staff_role(allowed public.staff_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = any(allowed));
$$;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'all-things-fresh',
  name text not null,
  phone text not null,
  email text,
  address text,
  requested_service text,
  vehicle_type text,
  vehicle_description text,
  preferred_date date,
  arrival_windows jsonb not null default '[]'::jsonb,
  source text not null default 'website',
  stage text not null default 'new' check (stage in ('new','contacted','qualified','quoted','won','lost','spam')),
  owner_id uuid references public.profiles(id),
  consent_sms_transactional boolean not null default false,
  consent_sms_marketing boolean not null default false,
  consent_email_marketing boolean not null default false,
  notes text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(), tenant_id text not null default 'all-things-fresh',
  name text not null, phone text, email text, street text, city text, state text, postal_code text,
  notes text, marketing_consent boolean not null default false, lifetime_value numeric(12,2) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(), tenant_id text not null default 'all-things-fresh',
  customer_id uuid not null references public.customers(id) on delete cascade,
  year integer, make text, model text, color text, plate text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(), tenant_id text not null default 'all-things-fresh',
  name text not null, slug text not null, short_blurb text not null, long_body text, price_from numeric(12,2),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  media_path text, seo_title text, seo_description text, packages jsonb not null default '[]'::jsonb,
  inclusions jsonb not null default '[]'::jsonb, faqs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(tenant_id, slug)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(), tenant_id text not null default 'all-things-fresh',
  lead_id uuid references public.leads(id) on delete set null, customer_id uuid references public.customers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null, service_id uuid references public.services(id) on delete set null,
  starts_at timestamptz not null, ends_at timestamptz,
  status text not null default 'scheduled' check (status in ('requested','scheduled','confirmed','en_route','in_progress','complete','cancelled','no_show')),
  address text, assigned_to uuid references public.profiles(id), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(), tenant_id text not null default 'all-things-fresh',
  appointment_id uuid references public.appointments(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null, vehicle_id uuid references public.vehicles(id) on delete set null,
  status text not null default 'scheduled' check (status in ('scheduled','en_route','in_progress','quality_check','complete','cancelled')),
  scheduled_date date, arrival_window text, address text, crew_ids jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '[]'::jsonb, photos jsonb not null default '[]'::jsonb, notes text,
  started_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(), tenant_id text not null default 'all-things-fresh',
  city text not null, state text not null default 'OH', slug text not null, local_intro text not null,
  neighborhoods jsonb not null default '[]'::jsonb, local_differentiators jsonb not null default '[]'::jsonb,
  map_query text, drive_time text, status text not null default 'draft', seo_title text, seo_description text,
  similarity_score numeric(5,2),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id, slug)
);

create table public.content_pages (
  id uuid primary key default gen_random_uuid(), tenant_id text not null default 'all-things-fresh',
  title text not null, slug text not null, page_type text not null, status text not null default 'draft',
  eyebrow text, heading text not null, intro text not null, sections jsonb not null default '[]'::jsonb,
  media_bindings jsonb not null default '{}'::jsonb, seo_title text, seo_description text, canonical_url text,
  robots text not null default 'index,follow', schema_json jsonb not null default '{}'::jsonb,
  published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(tenant_id, slug)
);

create table public.articles (
  id uuid primary key default gen_random_uuid(), tenant_id text not null default 'all-things-fresh',
  title text not null, slug text not null, category text, lede text not null, body jsonb not null default '[]'::jsonb,
  status text not null default 'draft', seo_title text, seo_description text, published_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id, slug)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(), tenant_id text not null default 'all-things-fresh',
  file_name text not null, storage_path text not null, alt_text text not null, mime_type text not null,
  width integer, height integer, slot_binding text, focal_point jsonb not null default '{"x":0.5,"y":0.5}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id, storage_path)
);

create table public.case_studies (
  id uuid primary key default gen_random_uuid(), tenant_id text not null default 'all-things-fresh',
  title text not null, slug text not null, vehicle text not null, city text not null, service text not null,
  summary text not null, steps jsonb not null default '[]'::jsonb, stats jsonb not null default '[]'::jsonb,
  before_media_id uuid references public.media_assets(id), after_media_id uuid references public.media_assets(id),
  approved_quote text, status text not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id, slug)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(), tenant_id text not null default 'all-things-fresh',
  customer_name text not null, review_date date, stars integer not null check (stars between 1 and 5), text text not null,
  source text, city text, approved boolean not null default false, featured boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.redirects (
  id uuid primary key default gen_random_uuid(), tenant_id text not null default 'all-things-fresh',
  source_path text not null, destination_path text not null, status_code integer not null default 301 check (status_code in (301,302,307,308)),
  active boolean not null default true, hits bigint not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id, source_path)
);

create or replace function public.record_redirect_hit(requested_tenant text, requested_path text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.redirects
  set hits = hits + 1, updated_at = now()
  where tenant_id = requested_tenant and source_path = requested_path and active = true;
$$;
revoke all on function public.record_redirect_hit(text, text) from public;
grant execute on function public.record_redirect_hit(text, text) to anon, authenticated;

create table public.notification_rules (
  id uuid primary key default gen_random_uuid(), tenant_id text not null default 'all-things-fresh',
  event text not null, channel text not null check (channel in ('email','sms','webhook')), destination text not null,
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.staff_invites (
  id uuid primary key default gen_random_uuid(), tenant_id text not null default 'all-things-fresh',
  email text not null, role public.staff_role not null default 'editor', token_hash text,
  expires_at timestamptz, accepted_at timestamptz, invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index leads_stage_created_idx on public.leads(tenant_id, stage, created_at desc);
create index appointments_starts_idx on public.appointments(tenant_id, starts_at);
create index jobs_schedule_idx on public.jobs(tenant_id, scheduled_date, status);
create index content_pages_status_idx on public.content_pages(tenant_id, status, page_type);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'leads','customers','vehicles','services','appointments','jobs','locations','content_pages','articles','media_assets','case_studies','reviews','redirects','notification_rules','staff_invites'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_staff())', table_name || '_staff_read', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.has_staff_role(array[''super_admin'',''admin'',''manager'']::public.staff_role[])) with check (public.has_staff_role(array[''super_admin'',''admin'',''manager'']::public.staff_role[]))',
      table_name || '_manager_write', table_name
    );
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', table_name || '_set_updated_at', table_name);
  end loop;
end $$;

-- Public reads are limited to explicitly published content. Operational data
-- never receives an anonymous policy; public forms write through the validated
-- server route using the service-role key.
create policy services_public_read on public.services for select to anon using (status = 'published');
create policy locations_public_read on public.locations for select to anon using (status = 'published');
create policy content_pages_public_read on public.content_pages for select to anon using (status = 'published');
create policy articles_public_read on public.articles for select to anon using (status = 'published');
create policy reviews_public_read on public.reviews for select to anon using (approved = true);
create policy redirects_public_read on public.redirects for select to anon using (active = true);

-- Restrict media to records; the actual bucket is provisioned by the setup
-- script so its size/MIME rules can be reviewed before client uploads begin.
comment on table public.media_assets is 'Metadata only. Create the private atf-media storage bucket during deployment and use signed URLs in admin.';
