-- Schema support for: lead-to-customer conversion and staff display names in the scheduling
-- calendar. None of these touch the public-facing design.
--
-- A CMS-editable navigation table was deliberately NOT added here. Both the homepage
-- (`ATF Detail Site.dc.html`) and the subpage template (`ATF Page Templates.dc.html`) bake their
-- header/footer nav in as literal, English-labelled markup with no per-item substitution slot —
-- confirmed by reading both files directly. The `src/components/layout/site-header.tsx` /
-- `site-footer.tsx` React components look like a plausible place to wire CMS-driven nav into, but
-- they are dead code (never imported by any route); real subpages render through
-- `getLockedSubpageMarkup` from the same frozen template as the homepage. Making nav labels
-- editable would mean adding new substitution points to a frozen design file, which needs explicit
-- design approval first (see CLAUDE.md) rather than being built silently.

-- Lets the admin link a lead to the customer record it was converted into.
alter table public.leads
  add column if not exists customer_id uuid references public.customers(id) on delete set null;

-- Lets the scheduling calendar and staff roster show a real name instead of only an email address.
alter table public.profiles
  add column if not exists display_name text;
