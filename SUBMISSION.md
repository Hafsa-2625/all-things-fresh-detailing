# Submission: All Things Fresh take-home

All work is on the `task-1` branch, in small commits on top of the starting point (map at the end).

> **Status (29 Sep 2026).** Tasks 0 and 2–6 are built and committed. Tasks 1 and 7 (hosted Supabase and
> Vercel) are **not done yet**: they need accounts that weren't available in my environment. The admin
> can't sign in without Supabase Auth, so the admin screens added for tasks 2, 4 and 5 are
> type-checked and linted, and the database rules behind them are tested against real Postgres. They
> have **not yet been clicked through end to end**. That's the first thing I'll do once task 1 is
> connected (see [What's left](#whats-left)), and I'll update this file then.

## Live site and test login

- **Live URL:** not deployed yet (task 7).
- **Admin test account:** will be created on the live project. The email and password will be sent
  with the submission, not committed here.

## At a glance

| Task | State |
|---|---|
| 0. Baselines | Done. 75 public URLs at 375 / 768 / 1440, plus homepage regions, element geometry and the reference viewport. |
| 1. Supabase | **Not done.** Needs a hosted project. RLS is proven locally by `npm run test:db`; steps for the hosted check are below. |
| 2. Quotes | Built. Database layer covered by 20 tests. Admin flow not yet run against Supabase. |
| 3. Responsive | Done. Every public page works at 375 and 768; 1440 unchanged. |
| 4. Before/after | Done, including the stretch. The admin photo upload is not yet run against Supabase. |
| 5. Homepage video | Done. The admin field is not yet run against Supabase. |
| 6. TikTok feed | Done. |
| 7. Vercel | **Not done.** Needs Vercel and the hosted Supabase project. |
| 8. Bonus | Fixed several things I found (listed below). `qa:security` not run: it needs the local Supabase stack (Docker). |

## Design freeze: what changed at 1440 px

**73 of the 75 public URLs render pixel-identical at 1440 px** to the baselines I captured before
changing anything. Those baselines were never re-accepted, and the suite compares at zero threshold.

The two exceptions are the homepage in English and Spanish (`/`, `/es`). Tasks 4–6 put new content
there:

- the before/after section (task 4);
- the video in the film box (task 5);
- the TikTok section (task 6).

To show nothing else moved, I rendered both pages with the before/after and TikTok sections hidden
and compared them with the original baselines. The only difference is the 1120×630 film box
(x 160–1279, y 1129–1758), which now holds the video instead of the "Add your video" placeholder.
Every other pixel is identical, and the page is the same height (7505 px).

A few other desktop baselines were also re-accepted for the same two pages:

- **Homepage booking and footer region shots.** These sections now sit lower on the page, which
  moves Chromium's raster tiles. The result is differences of 1–3 in one colour channel on some
  anti-aliased edges. With the new sections hidden, the shots are identical again.
- **Geometry JSON.** It records the new sections and the offsets below them.
- **The reference-viewport shot.** Same cause as the full-page change.

Nothing new was invented on public pages:

- The TikTok feed *is* the Instagram component (see task 6).
- The only new public control is the hamburger button that task 3 requires. It's a round icon button
  inside the approved nav pill, in the nav's own `#2c3033`, and it's `display: none` above 900 px.
  The open menu is the approved nav itself, stacked.
- The only new colour is TikTok's red `#fe2c55` Follow button, which the brief specifies.

Admin styles stay isolated: public pages still load only `src/app/[lang]/public.css`.

## What I did

### 0. Baselines

- There's no Docker on my machine, so I couldn't use the pinned Linux image. I ran the same
  Playwright suite (`npm run test:visual`) with the installed Chromium on Windows against the
  untouched code, before any change. The baselines are named `*-win32.png`.
- Coverage:
  - every URL in `docs/URL_INVENTORY.csv` (75), full page, at 375, 768 and 1440;
  - homepage region shots;
  - element geometry;
  - the homepage at the exact size of the supplied reference screenshot.
- Windows baselines are about 100 MB and only valid on the machine that made them, so they're
  gitignored (`66da38d`). As the brief asks when Docker isn't available, before/after screenshots are
  committed instead:
  - `docs/screenshots/task-3/`: the homepage and one page per template at 375/768 (before and
    after) and 1440, plus the open menu and the booking dialog on a phone.
  - `docs/screenshots/final/`: the finished homepage at 375/768/1440, the film playing, and a TikTok
    card on hover. The full-page shots come from the test harness, which pauses the clock, so the
    video box shows black there.

### 2. Quotes

**Database** (`supabase/migrations/0008_quotes.sql`)
- `quotes` has:
  - a link to a lead and/or customer, and a readable number (`Q-1001`, `Q-1002`, …);
  - status (`draft → sent → accepted / declined / expired`);
  - subtotal, tax, total, expiry date and notes;
  - links to the appointment and job it became.
- `quote_items` has description, quantity, unit price and line total.
- Both follow the existing conventions: `tenant_id`, the `updated_at` trigger, and RLS (staff read,
  manager+ write, no policy at all for `anon`).

**Totals can't drift.** Line totals, subtotal and total are computed by database triggers.
- The API schemas don't accept them.
- The database overwrites whatever is sent, so no client can make them disagree. That includes a
  direct PostgREST call with a manager's token.
- Inserting, editing, deleting or moving a line item re-saves the quote, or both quotes when an item
  moves.
- Tax is the only amount typed by hand.

**Locks**
- An accepted quote's prices are locked. Move it back to `sent` to change them.
- A scheduled quote can't leave `accepted`.
- Deleting the job unlinks it from the quote.

**Scheduling.** `schedule_quote()` does the whole thing in one transaction:
- It locks the quote, creates one appointment and one job for the quote's customer, and marks the
  quote accepted.
- A second call for the same quote fails and creates nothing.
- It refuses declined and expired quotes, and quotes whose lead hasn't been converted to a customer
  yet.
- Only the service role can execute it. The API route checks for a manager+ role before calling it.

**API and admin**
- `quotes` and `quote_items` are registered with the generic data API. Their Zod schemas in
  `src/lib/operations/schemas.ts` leave the totals out.
- On `/admin/leads`:
  - quote and line-item panels (`ResourceManager`);
  - a "Schedule an accepted quote" `WorkflowPanel`, which calls
    `POST /api/admin/workflows/schedule-quote`;
  - the database's refusals come back as 409s with its message ("already scheduled",
    "convert the lead first", …).
- On `/admin`:
  - an **Open quotes** card counts quotes still waiting on the customer or on scheduling;
  - draft or sent quotes expiring within 7 days, or already expired, are listed under
    *Needs attention*.
- `23ba5b0` fixes two existing admin bugs this flow ran into:
  - a `ResourceManager` never showed rows changed by another panel on the same page until a reload;
  - number fields rejected cents (`12.50`).

**Tests.** `npm run test:db` (`tests/db/`) runs every migration in PGlite (Postgres 17 in WASM, no
Docker) with small stand-ins for Supabase's roles and `auth` schema. Its 20 tests cover:
- line totals, the subtotal after every item insert, edit, delete and move, and tax;
- refusing totals sent by the client;
- the price lock;
- scheduling once and only once;
- tenant isolation;
- what anon, editor and manager can and can't do.

### 3. Mobile and tablet

- **Menu.** Below 900 px the header nav folds behind a hamburger button (the nav stops fitting at
  about 820 px). The button has `aria-expanded`, and the menu closes on Escape (focus returns to the
  button), on choosing a link, and on a tap or focus outside.
- **Layout.** The hero gives the car room, two-column blocks and grids stack, and the booking dialog
  scrolls within the screen. The social feeds and the footer reflow. No page scrolls sideways at any
  width from 320 to 1440 px.
- **Where the rules live.** Every rule is inside a `max-width` media query: in the adapters'
  responsive blocks (`home-template.ts`, `subpage-template.ts`, shared rules in `responsive.ts`) and
  in `public.css`. The rules target the design's inline styles by attribute, so desktop CSS is
  untouched.
- **Reviews.** On phones they show one card at a time, and the existing arrows rotate them. In
  `47b638d` the three cards share one grid cell, so a rotation no longer moves the page (CLS at
  375 px went from 0.053 to 0).

### 4. Before/after slider

- **Turned on** through the design's own `showComparison` default, so the server markup and the
  booted page agree and nothing jumps at load.
- **Photos.** The supplied ~3.5 MB JPEGs are served as WebP at 640–2560 px with `srcset`/`sizes`
  (about 120–145 KB at the 1440 default) and lazy-loaded. `scripts/optimize-compare-photos.mjs`
  rebuilds them.
- **Keyboard.** The slider is now an ARIA slider: arrow keys move it in 5% steps, and Home and End
  work. There's no visual change.
- **Stretch.** There are two new approved media slots (`compare-before`, `compare-after`), and the
  existing `MediaLibrary` is mounted on `/admin/website`. An upload bound to a slot replaces that
  photo, the same way the service images work. Slot uploads are re-encoded on the way in: EXIF
  orientation applied, metadata stripped, at most 2560 px wide, WebP.

### 5. Homepage video

- **Playback.** The film section plays `media.filmVideo` through the design's own embed logic:
  muted, looping, autoplaying, with no player chrome. With no URL it keeps the placeholder. The
  seeded tenant has the supplied Vimeo link.
- **Admin field.** `/admin/website` has a *Homepage video* field.
  - YouTube and Vimeo links in their usual shapes are accepted and stored in one canonical form.
  - Other hosts and private (hash) Vimeo links are refused with a message saying why: the design's
    embed can't play them.
- **Load behaviour.** Before the page script boots, the branch that won't render is dropped, so the
  placeholder no longer flashes before the video. The iframe `src` is bound only after boot. Before,
  the literal `{{ videoSrc }}` was framed on every load and blocked by CSP.
- **Visual tests** mask only the 16:9 box the video plays in, not the whole embed. The mask is drawn
  exactly over the box, so if the box moved or changed size the comparison would still fail.

### 6. TikTok feed

- **Same component as Instagram.** The section is the approved Instagram section (`#work`) with its
  bindings renamed, so card sizes, spacing, the hover overlay and the scroll arrows are the same
  component. Only the data, the TikTok glyph and the red Follow button differ, and it shows followers
  and likes (TikTok's profile stats) where Instagram shows posts and followers.
- **Settings.** The profile URL comes from `/admin/website`, and the handle is read from that URL. If
  TikTok is switched off there, the section is left out.
- **Images.** The six covers and the avatar are resized to WebP by
  `scripts/optimize-tiktok-assets.mjs`.
- **Checked at 1440, 768 and 375 px** in a real browser:
  - geometry matches the Instagram section;
  - the arrows scroll one card at a time and hide at the ends;
  - the hover overlay shows likes, comments and caption;
  - cards open the TikTok video in a new tab;
  - no console errors and no layout shift.

### Other fixes (bonus)

- Every published case study returned a 500 (`6d13752`). The page looked for image tags the approved
  design doesn't contain.
- Social profile links came out doubled when an admin URL started with the default one
  (`2060d02`).
- Before the page script booted, the Instagram feed requested a literal `{{ post.src }}` image URL.
  Both feeds now bind image URLs after boot (`35858d5`).
- The two admin bugs from task 2 (`23ba5b0`).

## How to run and verify

```bash
npm ci
cp .env.example .env.local        # Supabase values for task 1
npm run typecheck && npm run lint && npm run build
npm run test:db                   # quotes: totals, locks, scheduling, RLS (no Docker needed)
npm run seo:report
```

### Quote flow, by hand (once Supabase is connected)

1. `/admin/leads`: create a quote for a lead, then add two or more line items. The subtotal and total
   update after each change, and editing or deleting an item keeps them right.
2. Enter the tax. Total = subtotal + tax.
3. Set the status to *sent*.
4. Try to schedule it while the lead is still a lead. You get a 409: convert the lead first.
5. Convert the lead to a customer, then schedule the quote with a start time. The quote becomes
   *accepted*, and its prices are locked.
6. The job appears on `/admin/jobs` and `/admin/schedule`.
7. Schedule the same quote again. You get a 409 and nothing new is created.
8. `/admin` shows the *Open quotes* count, and quotes expiring within 7 days appear under
   *Needs attention*.

### RLS check (task 1)

**1. Locally, automated.** `npm run test:db`. These tests connect as `anon`:
- *"the anon key can read no quotes, line items, leads or customers"*;
- *"the anon key cannot create quotes or schedule them"*.

**2. Against the hosted project with the anon key.** Rows exist, but anon sees none:

```bash
URL=<NEXT_PUBLIC_SUPABASE_URL>; ANON=<NEXT_PUBLIC_SUPABASE_ANON_KEY>
curl -s "$URL/rest/v1/leads?select=id,name"     -H "apikey: $ANON" -H "Authorization: Bearer $ANON"   # []
curl -s "$URL/rest/v1/customers?select=id,name" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"   # []
curl -s "$URL/rest/v1/leads" -X POST -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "content-type: application/json" -d '{"name":"RLS probe","phone":"440-555-0199"}'
# refused: 42501 "new row violates row-level security policy for table \"leads\""
```

Run the same two GETs with the service-role key instead of `$ANON`: they return the rows. Public lead
capture still works because `/api/leads` writes with the service role on the server.

**3. In the Supabase SQL editor:**

```sql
select count(*) from public.leads;           -- as postgres: the real count

begin;
set local role anon;
select count(*) from public.leads;           -- 0
select count(*) from public.customers;       -- 0
select count(*) from public.quotes;          -- 0
rollback;

select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('leads', 'customers', 'quotes', 'quote_items');   -- all true
select tablename, policyname, roles, cmd from pg_policies
where tablename in ('leads', 'customers', 'quotes', 'quote_items');   -- only {authenticated} policies
```

`npm run qa:security` covers the same ground more broadly (anon and self-signed-up users against
every private table, plus `schedule_quote`). It creates users and data, so it's meant for a
disposable local stack only, never the reviewed project.

### Visual regression

```bash
npm run build:visual && npm run start:visual   # production build without Supabase, port 3200
npm run test:visual                            # compares with your local baselines
```

Baselines aren't committed, so to reproduce the design-freeze check:
1. Check out `main` and build it.
2. Capture with `npm run test:visual -- -u`, or with `test:visual:update` in Docker.
3. Check out `task-1`, rebuild, and compare.

Expected differences:
- `/` and `/es` at every width;
- every page at 375 and 768 (task 3);
- nothing else at 1440.

## Assumptions

- **Tax** is an amount entered by hand, not a rate.
- **Which quotes can be scheduled.** A draft, sent or accepted quote that isn't scheduled yet.
  Scheduling means the customer said yes, so it also marks the quote accepted. Declined and expired
  quotes can't be scheduled.
- **Scheduling needs a customer.** A quote on an unconverted lead is refused with a clear message
  rather than converting the lead silently.
- **Expiry.** "Expiring soon" means within 7 days, and includes quotes already past their date.
  Nothing moves a quote to `expired` automatically.
- **Quote numbers** come from one database sequence. They're unique per tenant, but a tenant can see
  gaps.
- **Appointment start times** are stored as entered (a `datetime-local` value), like every other
  appointment time in the admin.
- **TikTok handle.** The brief says the TikTok URL and handle are editable in `/admin/website`, but
  only the URL (and on/off) is. The feed reads the handle from the URL, so the two can't disagree.
- **Feed data.** The TikTok profile, counts and posts come from `candidate-assets/tiktok/`, versioned
  in `src/lib/social/content.ts`, the same way the Instagram feed already worked. They aren't fetched
  live.
- **Breakpoints.** The menu collapses below 900 px. Grids and reviews go to one column below 600 px.

## Known issues and risks

- **The biggest risk** is that the admin side of tasks 2, 4 and 5 hasn't run against a real Supabase
  yet: the quote panels, scheduling, dashboard cards, photo upload and video field. The database
  rules are tested, and the UI reuses existing components, but it still has to be clicked through.
- **Flaky visual tests.** Two tests occasionally fail and pass on a rerun:
  - `clock.pauseAt` can fail with "Cannot fast-forward to the past" when the first load is slow;
  - the phone hero-car animation frames are timing-sensitive.
- **With JavaScript disabled,** the booking dialog's iframe still points at the literal
  `{{ jobberSrc }}`. CSP blocks it, so the only effect is a console error. This predates my changes,
  and I left it to keep the change set focused. The same fix as the video would work.
- **Things in the starting code:**
  - one pre-existing lint warning (`<img>` in `src/components/layout/site-footer.tsx`);
  - `scripts/security-e2e.ts` refers to `docs/PROD_READINESS_CHECKLIST.md`, which isn't in the repo.

## What's left

**Task 1**
1. Create the hosted Supabase project and apply `0001`–`0008` in order.
2. Turn off sign-ups. Set the Site URL and redirects: localhost, and the Vercel domain for task 7.
3. Fill `.env.local`, run `seed:tenant -- all-things-fresh` and `seed:content`, and sign in as the
   bootstrap admin.
4. Check "Database connected" on the dashboard, and a homepage lead appearing in `/admin/leads` and
   the `leads` table.
5. Run the RLS check above.
6. Walk through the quote flow, the photo upload and the video field.

**Task 7**
1. Connect the repo to Vercel, set the env vars from `.env.example`, and deploy.
2. Add `https://<app>.vercel.app/admin/auth/callback` as a redirect.
3. Invite the admin test account, and set its password under *My account*.
4. Enter test data with made-up people:
   - 5+ leads across stages;
   - 3 customers with vehicles;
   - 3 quotes: one draft, one sent, one accepted and scheduled.
5. Submit a lead on the live site and see it in the live admin.

## What I'd do differently

- **Get the Supabase and Vercel access on day one,** so the admin features are exercised against the
  real stack as they're built, not at the end.
- **Capture the baselines in the pinned Linux image,** so they match your runner and can be shared. My
  Windows baselines are only valid on my machine.
- **Add a Playwright end-to-end test of the quote flow** against a disposable local Supabase, next to
  the database tests.
- **Refresh the feed data from the platforms on a schedule.** Today the counts are a snapshot and
  will go stale.

## Commit map

| Task | Commits |
|---|---|
| 0 | `66da38d` keep local baselines out of git |
| 2 | `45935aa` migration · `cc4a6bb` database tests · `23ba5b0` admin table fixes · `27e78ca` API, admin and workflow · `dfe37a9` dashboard |
| 3 | `075bca4` menu · `67866bc` responsive rules · `4d105d0` screenshots · `47b638d` phone reviews without layout shift |
| 4 | `884060d` section and photos · `8388621` keyboard · `4fc495f` admin photo replacement |
| 5 | `00f42ab` video from tenant settings · `7dbdaba` admin field |
| 6 | `35858d5` TikTok feed |
| Fixes | `6d13752` case-study 500 · `2060d02` doubled profile links |
