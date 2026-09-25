# Architecture

## Public application

Next.js 16 and React 19 serve locale-aware routes. `src/proxy.ts` preserves clean public URLs, maps them to internal locale routes, applies database-managed redirects, and stores the locale cookie.

The approved ZIP files in `design-source/current-zip/` remain the visual authority. `home-template.ts` and `subpage-template.ts` adapt those files into reusable locked templates. The adapters change text, links, media, structured data, and form names; they do not introduce a replacement design system.

The SEO registry under `src/seo/` contains typed page data, keyword clusters, relationships, publish status, and a quality gate. Static registry content works without a database. Published `content_pages` records can override fields or create new URLs using the same locked templates.

## Operations console

The separate `/admin` application uses passwordless Supabase authentication and role checks:

- editor: read-only
- manager: operational/content writes
- admin: manager capabilities plus integration operations
- super_admin: high-privilege staff role grants

New profiles always start as editor. The first super-admin promotion is limited to `ADMIN_BOOTSTRAP_EMAIL` in the auth callback.

The generic admin API validates each resource with Zod, writes through the service-role client, records audit events, and revalidates public content and the sitemap. The shared table UI supports create, full-field edit, and workflow status changes.

## Data model

`0001_cms_foundation.sql` creates profiles, versioned tenant configuration, and the audit log. `0002_operations_crm_cms.sql` adds leads, customers, vehicles, services, appointments, jobs, locations, content pages, articles, media, case studies, reviews, redirects, notification rules, and staff invites.

Operational data has no anonymous policies. Anonymous reads are limited to published/approved public content and active redirects. Public lead writes go through the validated server API.

## Media

Media uploads validate staff role, MIME type, file size, and alt text, use a private Supabase Storage bucket, then create a metadata record.

## Safe fallbacks

The public site uses versioned content when Supabase is absent or temporarily unavailable. Development may opt into a local JSON operations store. Production rejects local customer-data storage by default.
