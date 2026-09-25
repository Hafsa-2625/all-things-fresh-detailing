-- Catalog content the public pages read: add-ons, and the per-service/-location fields the
-- approved components already have slots for. Run after 0003_security_hardening.sql.

-- ---------------------------------------------------------------------------
-- Add-ons (spec §3: name, price, applies-to services[])
-- ---------------------------------------------------------------------------
create table if not exists public.add_ons (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'all-things-fresh',
  name text not null,
  -- Shown verbatim next to the name, e.g. "+$40" or "Quoted". Free text so the owner controls
  -- exactly what a customer reads; there is no calculation on it.
  price_label text not null,
  -- Service slugs this add-on applies to. Empty means every service page.
  applies_to jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

alter table public.add_ons enable row level security;

create policy add_ons_staff_read on public.add_ons
  for select to authenticated using (public.is_staff());
create policy add_ons_manager_write on public.add_ons
  for all to authenticated
  using (public.has_staff_role(array['super_admin','admin','manager']::public.staff_role[]))
  with check (public.has_staff_role(array['super_admin','admin','manager']::public.staff_role[]));
create policy add_ons_public_read on public.add_ons
  for select to anon using (status = 'published');

create trigger add_ons_set_updated_at
  before update on public.add_ons
  for each row execute function public.set_updated_at();

create index if not exists add_ons_published_idx on public.add_ons (tenant_id, status, sort_order);

-- ---------------------------------------------------------------------------
-- Service and location fields used by the approved components
-- ---------------------------------------------------------------------------
-- Packages: [{ "name": "...", "price_label": "from $149" | "Custom quote", "blurb": "..." }]
-- Inclusions: [{ "title": "...", "note": "..." }]  FAQs: [{ "question": "...", "answer": "..." }]
comment on column public.services.packages is 'Array of {name, price_label, blurb}; up to 3 render on the service page.';
comment on column public.services.inclusions is 'Array of {title, note}; up to 6 render in the "What is included" checklist.';
comment on column public.services.faqs is 'Array of {question, answer}; up to 4 render beside the add-ons panel.';

alter table public.locations add column if not exists travel_fee_label text;
alter table public.locations add column if not exists time_on_site_label text;
comment on column public.locations.neighborhoods is 'Array of strings listed under "Neighbourhoods we detail in".';
comment on column public.locations.local_differentiators is 'Array of {title, note}; three render as the local check-list.';
comment on column public.locations.drive_time is 'Stat panel value, e.g. "15 min". Shown with "From our base to <city>".';

-- Review aggregates are computed from approved reviews, never stored, so the rating block can
-- only ever show what real approved reviews support.
create index if not exists reviews_approved_idx on public.reviews (tenant_id, approved, featured, review_date desc);
create index if not exists services_published_slug_idx on public.services (tenant_id, status, slug);
create index if not exists locations_published_slug_idx on public.locations (tenant_id, status, slug);
