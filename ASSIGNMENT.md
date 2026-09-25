# Take-home assignment: All Things Fresh Car Detailing

All Things Fresh is a mobile car-detailing business in the Cleveland area. This repository is its
website and operations console: a public marketing site (70+ SEO pages) plus an `/admin` area
where staff manage leads, customers, jobs, scheduling and site content.

Most of the platform is built. Your job is to connect it to a real database, finish the parts
we have deliberately removed, and ship it in a state we could deploy.

**Suggested time:** 2–3 working days. If you run out of time, stop and tell us what's left and
how you'd approach it. A well-reasoned partial submission beats a rushed complete one.

**AI tools are expected.** Use Claude Code, Cursor, Copilot or whatever you prefer. `CLAUDE.md`
is already set up for AI agents. You're responsible for the result: review what the tools
produce, and make sure it follows the rules below.

---

## Read this first: the design is frozen

The public site's design has been approved by the client and **must not change** on desktop.
Read [`CLAUDE.md`](CLAUDE.md) before writing any code: it's the rulebook for this project.

In short:

- The visual source of truth is `design-source/current-zip/ATF Detail Site.dc.html` (homepage)
  and `ATF Page Templates.dc.html` (every other public page). The app renders these files through
  adapters in `src/lib/locked-design/`. It does not re-implement them in React.
- Do not change layout, fonts, colours, spacing, animation or components on public pages.
- Admin UI may look different, but its styles must never leak into public pages.
  Public pages load only `src/app/[lang]/public.css`, never `src/app/globals.css`.
- If something you need doesn't fit an existing component, **stop and write it down** in your
  submission rather than inventing new design.

How carefully you respect these rules is part of the evaluation.

---

## What's already done

| Area | State |
|---|---|
| Public site | Homepage (incl. Instagram feed) and all public templates, English + Spanish, 70+ SEO URLs, sitemap, robots, canonical/hreflang, structured data |
| SEO registry | `src/seo/`: typed page data with a quality gate (`npm run seo:report`) |
| Lead capture | Homepage request form + booking modal → `POST /api/leads` (Zod validation, honeypot, rate limit) |
| Admin auth | Supabase password + magic-link sign-in, roles (`editor` / `manager` / `admin` / `super_admin`), bootstrap super admin via `ADMIN_BOOTSTRAP_EMAIL` |
| Admin: operations | Leads, lead → customer conversion, customers & vehicles, appointments, jobs, crew schedule, staff invites |
| Admin: settings | Phone, hours, service area, booking link and social links (`/admin/website`) |
| Database | SQL migrations `0001`–`0007` in `supabase/migrations/` with RLS policies and an audit log |
| Email | Resend integration for new-lead notifications (`src/lib/email/`) |
| Quality gates | `typecheck`, `lint`, `qa:crawl`, `qa:api`, `qa:security`, Playwright visual-regression suite |

Without Supabase credentials, the public site runs from versioned content and lead submissions
go to a local JSON file (`.data/atf-local-store.json`). The admin needs Supabase Auth to sign in,
so you'll only see `/admin` after task 1.

---

## What you need to do

### 0. Get running and set a baseline

```bash
npm ci
cp .env.example .env.local        # fill in as you go
npm run dev                       # http://localhost:3000
```

Before changing anything, **capture your own visual baselines** of the public pages at
375 / 768 / 1440 px (see "Design-freeze gate" below). No baselines are committed, so
capture them first, on the untouched code. Your desktop (1440 px) screenshots must stay
unchanged by the end of the assignment.

### 1. Supabase and database setup

Connect the app to a real Supabase project. Either the hosted free tier or a local stack via
`npx supabase start` (config in `supabase/config.toml`) is fine for development, but task 7
(Vercel) needs a hosted project.

- Apply the migrations in `supabase/migrations/` in numeric order.
- Configure Auth: disable public sign-ups, set the Site URL and the redirect
  `http://localhost:3000/admin/auth/callback` (plus your deployed domain if you deploy).
- Set the env vars in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_BOOTSTRAP_EMAIL`).
- Seed: `npm run seed:tenant -- all-things-fresh` then `npm run seed:content`.
- Sign in at `/admin/login` as the bootstrap admin.

**Done when:**
- A lead submitted from the homepage form shows up in `/admin/leads` and in the `leads` table.
- The admin dashboard shows "Database connected".
- An anonymous client using the anon key **cannot** read `leads` or `customers`. Show us how you
  verified this.

### 2. Quotes (the main build task)

The quoting feature has been removed from the database, API and admin. Staff need to price a job
for a lead and then schedule it. Build it end to end:

- **Migration** `0008_quotes.sql`: a `quotes` table (linked to a lead and/or customer, a
  human-readable quote number, status, subtotal, tax, total, expiry, notes, timestamps) and a
  `quote_items` table (description, quantity, unit price, line total). Follow the existing
  conventions: `tenant_id`, `updated_at` trigger, and RLS (staff read, manager+ write, no anonymous
  access).
- **API**: register both resources with the generic admin data API
  (`src/app/api/admin/data/[resource]/route.ts` and Zod schemas in `src/lib/operations/schemas.ts`).
  **Subtotal and total must be computed on the server from the line items.** Tax is entered by
  hand. Adding, editing or deleting a line item must keep the quote's totals correct.
- **Admin UI** on `/admin/leads`: create and edit quotes, manage their line items, change status
  (`draft → sent → accepted / declined / expired`). Reuse the existing admin components
  (`ResourceManager`, `WorkflowPanel`, …).
- **Workflow**: "Schedule an accepted quote". Pick an open quote plus a start time; this creates an
  appointment and a job linked to the quote's customer and marks the quote accepted. Accepting the
  same quote twice must fail. `src/app/api/admin/workflows/lead-to-customer` is a good pattern to
  follow.
- **Dashboard**: an "Open quotes" count and a "quote expiring soon" item under *Needs attention*
  on `/admin`.

**Done when:** you can go lead → quote with 2+ line items → send → accept & schedule → see the
job on `/admin/jobs` and `/admin/schedule`, and the totals are correct at each step. Include
tests or a script that proves the totals logic.

### 3. Mobile and tablet responsiveness

The public site currently only works on desktop. Below ~900 px, the header nav overflows, the
hero text overlaps the car, and grids don't stack. Make every public page work at **375 px and
768 px** (iPhone Safari and Android Chrome):

- A hamburger menu for the header nav below the width where it stops fitting. It must be keyboard
  accessible (`aria-expanded`, closes on Escape, on link click, and on tap outside).
- Hero, sections and grids adapt; no horizontal scrolling at any width.
- Social carousel and footer adapt.
- **Desktop must be pixel-identical to your baseline.** Use media queries only; don't touch
  desktop rules.

Where to work: each locked-design adapter has an empty
`<style data-atf-responsive="true">` block (`src/lib/locked-design/home-template.ts`,
`subpage-template.ts`) that is injected into the page. Component CSS lives in
`src/app/[lang]/public.css`. The client-side boot component is
`src/components/locked-design/dc-runtime.tsx`. You can't edit the design source's inline styles
per breakpoint, so think about how to target them.

**Done when:** screenshots at 375 / 768 / 1440 of the homepage and one page of each template
(service, location, article, FAQ) look right, and the 1440 ones match your baseline.

### 4. Before/after slider

The homepage has a draggable before/after comparison section. It's currently switched off
(`showComparison` defaults to `false` in the homepage design source) and its photos have been
removed. They're in [`candidate-assets/before-after/`](candidate-assets/before-after/).

- Bring the section back with these photos. They're ~3.5 MB each, so size and compress them
  sensibly for the web.
- **Stretch:** let staff replace the two photos from the admin. The upload endpoint
  (`/api/admin/media`) and a `MediaLibrary` component (`src/components/admin/media-library.tsx`)
  exist but aren't mounted on any page. Wire the photos into the homepage the same way the service
  images work (`fillApprovedMediaSlots` in `home-template.ts`).

### 5. Homepage video

The homepage film section should play a muted, looping, autoplaying video with no player chrome.
It currently shows the design's "Add your video" placeholder. The Vimeo link is in
[`candidate-assets/video/VIDEO.md`](candidate-assets/video/VIDEO.md).

- Make the video URL editable from **`/admin/website`** (YouTube or Vimeo), stored with the other
  tenant settings. `src/tenant/schema.ts` already has an unused `media.filmVideo` field.
- Fall back to the placeholder when no URL is set.

### 6. TikTok feed

Below the Instagram feed, the homepage should also show a **TikTok feed** that
matches the Instagram one exactly. Build it the same way the Instagram section is built:

- Profile header with avatar, name, handle, and follower and like counts, plus a red
  (`#fe2c55`) "Follow" button.
- A horizontal rail of post cards with a scroll arrow, a hover overlay with likes, comments and
  caption, and each card linking to the TikTok video.
- The same card sizes, spacing, hover behaviour and carousel arrows as Instagram. It should look like
  one design system, not a new component.

The profile data, 6 posts, and the avatar and cover images are in
[`candidate-assets/tiktok/`](candidate-assets/tiktok/) (`tiktok-feed.json`).

Where to look: the Instagram section markup (`#work`) and its script bindings (`ig*`) in
`design-source/current-zip/ATF Detail Site.dc.html`, the feed data in
`src/lib/social/content.ts`, and the `.atf-social*` styles in `src/app/[lang]/public.css`.
The TikTok profile URL and handle are already editable in `/admin/website`. The feed should use them.

**Done when:** both feeds render on the homepage, the TikTok one is visually consistent with
Instagram on desktop and mobile, arrows work, and there are no console errors.

### 7. Deploy to Vercel

Host the finished app on **Vercel** (the free tier is fine) so we can review it live.

- Use a **hosted** Supabase project (free tier). A local database isn't reachable from Vercel.
  Apply the migrations (including your `0008_quotes.sql`) and seed it.
- Set the environment variables from `.env.example` in Vercel. `NEXT_PUBLIC_*` values are baked
  in at build time, so redeploy after changing them.
- In Supabase → Auth → URL Configuration, set the Site URL to your Vercel domain and add
  `https://<your-app>.vercel.app/admin/auth/callback` as a redirect.
- Create a test account for us with the **admin** role (email and password sign-in). Invite it
  from *Staff & permissions*, then set its password under *My account*. Editors are read-only, so
  an editor account can't test your work.
- Fill the live project with **realistic test data** so we can review it without setting anything up:
  at least 5 leads at different stages, 3 customers with vehicles, and 3 quotes with line items
  (one draft, one sent, one accepted and scheduled into an appointment and job). Use made-up
  names and contact details, not real people.

**Done when:** the public site and `/admin` work on your Vercel URL, a lead submitted on the live
site shows up in the live admin, the test data is in place, and you've sent us the URL plus the
admin login.

### 8. Bonus (optional)

Pick any of these, or none:

- Email notifications: configure Resend and prove a new lead emails the addresses listed under
  *Leads → New-lead emails*.
- Run `npm run qa:security` against your **local** Supabase and fix anything it finds.
- Anything you spotted that's broken or risky. Tell us about it even if you don't fix it.

---

## Commands

```bash
npm run dev            # dev server
npm run typecheck      # must pass
npm run lint           # must pass
npm run build          # must pass
npm run seo:report     # SEO quality gate
npm start & npm run qa:crawl && npm run qa:api   # against a running server
```

### Design-freeze gate (visual regression)

Baselines are Linux renders, so compare inside the pinned Playwright Docker image:

```bash
npm run build:visual && npm run start:visual    # production build without Supabase, port 3200
npm run test:visual:update                      # capture your baseline (step 0)
npm run test:visual:docker                      # compare after your changes
```

No Docker? Take your own before/after screenshots at the three widths and include them in your
submission instead.

---

## Project map

```
design-source/current-zip/     Approved design files: the visual source of truth (read-only)
src/lib/locked-design/         Adapters that render the design files as pages
src/app/[lang]/                Public routes (en/es)
src/app/admin/                 Operations console
src/app/api/                   Lead intake, admin data API, workflows, media upload
src/lib/operations/            Data store (Supabase or local JSON), Zod schemas, dashboard insights
src/seo/                       SEO page registry and quality gate
src/tenant/                    Business settings (phone, hours, social, brand)
supabase/migrations/           Database schema
scripts/                       Seeding, SEO reports, QA scripts
tests/visual/                  Playwright visual-regression suite
candidate-assets/              Photos, video link and TikTok data for tasks 4–6
docs/architecture.md           Short architecture overview
```

---

## What to submit

1. **The live Vercel URL** and the test admin email and password (task 7). We'll sign in and
   test the live site ourselves, so make sure the test data is there.
2. A Git repository (GitHub/GitLab link or a zip including `.git`) with **small, well-described
   commits**. We read the history.
3. A `SUBMISSION.md` covering:
   - What you completed, what you didn't, and why.
   - How to run and verify your work, including SQL or steps for the RLS check.
   - Anything you'd do differently with more time.
4. **Never commit secrets.** `.env.local` is gitignored. Keep it that way.

## How we evaluate

- **Correctness:** the quote flow works and totals can't drift; RLS actually protects data.
- **Respect for constraints:** desktop is unchanged; no new design invented on public pages;
  admin styles stay isolated.
- **Code quality:** matches the existing conventions, is readable, and has no dead code.
- **Judgement:** sensible trade-offs, and clear communication about what's missing or risky.
- **Git hygiene:** focused commits with useful messages.

Questions are welcome. If something is ambiguous, make a reasonable assumption and write it
down in `SUBMISSION.md`.
