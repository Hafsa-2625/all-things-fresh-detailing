-- Quotes: staff price a job for a lead or customer with line items, send it, and schedule it once
-- accepted. Money is computed here, not in the app, so no client can make the numbers disagree:
--   * quote_items.line_total is a generated column (quantity × unit price);
--   * quotes.subtotal is recalculated from the items whenever the quote or any of its items is
--     written, overwriting whatever a caller sent;
--   * quotes.total is a generated column (subtotal + tax). Tax is the only amount typed by hand.
-- Admin-only, like the rest of the CRM: staff read, managers and above write, no anonymous access.

create sequence if not exists public.quote_number_seq start with 1001;
grant usage on sequence public.quote_number_seq to authenticated, service_role;

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'all-things-fresh',
  quote_number text not null default ('Q-' || nextval('public.quote_number_seq')),
  lead_id uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','sent','accepted','declined','expired')),
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0 check (tax >= 0),
  total numeric(12,2) generated always as (subtotal + tax) stored,
  expires_on date,
  notes text,
  -- Set once, by public.schedule_quote(), when the accepted quote becomes a visit.
  appointment_id uuid references public.appointments(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, quote_number),
  constraint quotes_scheduled_is_accepted check (job_id is null or status = 'accepted')
);
alter sequence public.quote_number_seq owned by public.quotes.quote_number;

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'all-things-fresh',
  quote_id uuid not null references public.quotes(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) generated always as (round(quantity * unit_price, 2)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotes_status_expiry_idx on public.quotes(tenant_id, status, expires_on);
create index if not exists quote_items_quote_idx on public.quote_items(quote_id);

alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
create policy quotes_staff_read on public.quotes for select to authenticated using (public.is_staff());
create policy quotes_manager_write on public.quotes for all to authenticated
  using (public.has_staff_role(array['super_admin','admin','manager']::public.staff_role[]))
  with check (public.has_staff_role(array['super_admin','admin','manager']::public.staff_role[]));
create policy quote_items_staff_read on public.quote_items for select to authenticated using (public.is_staff());
create policy quote_items_manager_write on public.quote_items for all to authenticated
  using (public.has_staff_role(array['super_admin','admin','manager']::public.staff_role[]))
  with check (public.has_staff_role(array['super_admin','admin','manager']::public.staff_role[]));
create trigger quotes_set_updated_at before update on public.quotes
  for each row execute function public.set_updated_at();
create trigger quote_items_set_updated_at before update on public.quote_items
  for each row execute function public.set_updated_at();

-- Both totals triggers are security definer so the sum always sees every item and the parent is
-- always re-saved: under the caller's RLS a hidden row would be skipped silently, and the totals
-- would drift without an error.
create or replace function public.quotes_compute_totals()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.subtotal := coalesce((select sum(line_total) from public.quote_items where quote_id = new.id), 0);

  if tg_op = 'UPDATE' and old.job_id is not null and new.job_id is not null and new.status <> 'accepted' then
    raise exception 'Quote % is already scheduled. Cancel its job instead of changing the quote.', old.quote_number
      using errcode = 'object_not_in_prerequisite_state';
  end if;
  -- The customer agreed to these amounts; reopen the quote (status back to sent) to change them.
  if tg_op = 'UPDATE' and old.status = 'accepted' and new.status = 'accepted'
     and (new.subtotal <> old.subtotal or new.tax <> old.tax) then
    raise exception 'Quote % has been accepted, so its prices are locked.', old.quote_number
      using errcode = 'object_not_in_prerequisite_state';
  end if;
  return new;
end;
$$;

create trigger quotes_compute_totals before insert or update on public.quotes
  for each row execute function public.quotes_compute_totals();

-- Re-saving the parent quote re-runs quotes_compute_totals. It runs in the same statement as the
-- item change and takes the quote's row lock, so concurrent item writes queue up and each one
-- recalculates from the committed items rather than overwriting the other's result.
create or replace function public.quote_items_resave_quote()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op <> 'INSERT' then
    update public.quotes set updated_at = now() where id = old.quote_id;
  end if;
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.quote_id is distinct from old.quote_id) then
    update public.quotes set updated_at = now() where id = new.quote_id;
  end if;
  return null;
end;
$$;

create trigger quote_items_resave_quote after insert or update or delete on public.quote_items
  for each row execute function public.quote_items_resave_quote();

-- "Schedule an accepted quote": one transaction creates the appointment and the job for the
-- quote's customer and marks the quote accepted. `for update` makes a second call for the same
-- quote wait for the first and then fail on the job it created, so a quote is scheduled once.
-- Only the server (service role) may call it; the route checks the staff member's role first.
create or replace function public.schedule_quote(p_tenant_id text, p_quote_id uuid, p_starts_at timestamptz, p_actor uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  target public.quotes;
  target_customer uuid;
  visit_address text;
  new_appointment uuid;
  new_job uuid;
begin
  select * into target from public.quotes where id = p_quote_id and tenant_id = p_tenant_id for update;
  if not found then
    raise exception 'Quote not found' using errcode = 'no_data_found';
  end if;
  if target.job_id is not null then
    raise exception 'Quote % has already been accepted and scheduled.', target.quote_number
      using errcode = 'object_not_in_prerequisite_state';
  end if;
  if target.status not in ('draft','sent','accepted') then
    raise exception 'Quote % is %, so it cannot be scheduled.', target.quote_number, target.status
      using errcode = 'object_not_in_prerequisite_state';
  end if;

  target_customer := coalesce(target.customer_id, (select customer_id from public.leads where id = target.lead_id));
  if target_customer is null then
    raise exception 'Convert the lead on quote % to a customer before scheduling it.', target.quote_number
      using errcode = 'object_not_in_prerequisite_state';
  end if;

  select nullif(concat_ws(', ', street, city, nullif(concat_ws(' ', state, postal_code), '')), '')
    into visit_address
    from public.customers where id = target_customer;

  insert into public.appointments (tenant_id, lead_id, customer_id, starts_at, status, address, notes)
  values (p_tenant_id, target.lead_id, target_customer, p_starts_at, 'scheduled', visit_address, 'Quote ' || target.quote_number)
  returning id into new_appointment;

  insert into public.jobs (tenant_id, appointment_id, customer_id, status, scheduled_date, address, notes)
  values (p_tenant_id, new_appointment, target_customer, 'scheduled', p_starts_at::date, visit_address, 'Quote ' || target.quote_number)
  returning id into new_job;

  update public.quotes
     set status = 'accepted', customer_id = target_customer, appointment_id = new_appointment, job_id = new_job
   where id = target.id;

  insert into public.audit_log (actor, action, entity, entity_id, detail) values
    (p_actor, 'create', 'appointments', new_appointment::text, jsonb_build_object('quote_id', target.id)),
    (p_actor, 'create', 'jobs', new_job::text, jsonb_build_object('quote_id', target.id, 'appointment_id', new_appointment)),
    (p_actor, 'schedule', 'quotes', target.id::text, jsonb_build_object('appointment_id', new_appointment, 'job_id', new_job, 'starts_at', p_starts_at));

  return jsonb_build_object('quote_id', target.id, 'customer_id', target_customer, 'appointment_id', new_appointment, 'job_id', new_job);
end;
$$;
revoke all on function public.schedule_quote(text, uuid, timestamptz, uuid) from public, anon, authenticated;
grant execute on function public.schedule_quote(text, uuid, timestamptz, uuid) to service_role;
