-- Case studies publish through the locked case-study template (/our-work/<slug>).
-- Every slot in that template is filled from the record, so the quote attribution and job date
-- need their own columns, and public pages need to read published records and their two photos.

alter table public.case_studies add column if not exists quote_name text;
alter table public.case_studies add column if not exists completed_on date;

create policy case_studies_public_read on public.case_studies
  for select to anon using (status = 'published');

-- Only the before/after photos of a published case study become readable; other unbound uploads
-- stay staff-only (see 0005_media_public_read.sql).
create policy media_assets_case_study_read on public.media_assets
  for select to anon using (
    exists (
      select 1 from public.case_studies c
      where c.status = 'published' and (c.before_media_id = media_assets.id or c.after_media_id = media_assets.id)
    )
  );

create index if not exists case_studies_status_idx on public.case_studies (tenant_id, status, completed_on desc);
