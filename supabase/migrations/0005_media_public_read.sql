-- Public pages read media by slot binding (src/lib/content/catalog.ts getSlotMedia). Without this
-- the anon key sees no rows and every slot silently falls back to its versioned image.
--
-- Only rows bound to one of the approved design slots are exposed: those objects are already public
-- in the atf-media bucket. Unbound library uploads stay staff-only.
create policy media_assets_public_read on public.media_assets
  for select to anon using (slot_binding is not null);

create index if not exists media_assets_slot_idx
  on public.media_assets (tenant_id, slot_binding, created_at desc) where slot_binding is not null;
