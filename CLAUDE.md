# All Things Fresh Car Detailing — project rules

## ABSOLUTE DESIGN FREEZE (overrides all earlier instructions)

The existing public site design in `ATF Detail Site.dc.html` is **approved and locked**. This
project is backend / CMS / CRM / SEO / page-expansion work — **not a redesign**.

### Never change (public pages)
Layouts, section order and dimensions, grids, container widths, element coordinates, alignment,
margins, padding, gaps, typography (Outfit), font sizes/weights/line-heights/letter-spacing,
colors, gradients, borders, radii, shadows, nav, footer, buttons, icons, logo presentation, car
assets, dirty-to-clean transition, floating-logo animation, customer-count presentation, social
controls, image sizes/positions, breakpoints (mobile/tablet/desktop), hover/focus states, motion
timing, easing, z-index relationships.

- Do not rebuild the homepage from scratch or swap components for visually similar ones.
- Do not replace existing CSS with a new design system or UI kit defaults.
- Do not replace icons or change brand colors/typography.
- Do not add banners, popups, cards, badges, animations or decorative elements without explicit
  approval.
- No visual refactoring unless required to reproduce the exact existing output.
- No cumulative layout shift.
- Backend integration must be visually invisible.

### CMS scope
Admin may edit **content only** through structured fields tied to existing approved components:
copy, images/videos in existing slots, links, nav labels/destinations, phone, email, social,
services, prices, add-ons, FAQs, reviews, case studies, resource articles, service-area info,
hours, CTAs, SEO metadata, structured data, redirects, forms + notification recipients, leads,
customers, vehicles, quotes, jobs, appointments, invoices, payments, staff, permissions.

Lock or omit any public-facing control for fonts, sizes, colors, gradients, spacing, container
widths, borders, radii, shadows, breakpoints, grid columns, section structure, positioning,
animation timing, component styling, custom CSS/JS, arbitrary page-builder blocks, section
dragging, global theme replacement. **No unrestricted visual page builder.**

### New URLs (60+)
Reuse the approved header, nav, footer, buttons, typography, spacing exactly. A limited set of
templates built entirely from existing components — not a new layout per service or city. No
generic blog / SaaS / WordPress / dashboard styling on public pages. Location pages still need
genuinely unique local content.

**If a content requirement cannot fit an existing component, STOP and flag it for approval
instead of inventing a new public design.**

### Admin interface
May be operations-focused and visually separate, but: admin styling must not leak into public
pages, styles isolated, admin deps must not change public rendering, admin components must not
replace public ones, public pages must not load admin code.

### Visual-regression protection
Before connecting CMS/backend, capture baselines of every public page at 375 / 768 / 1440px and
at the exact viewport of every supplied reference screenshot. Playwright visual-regression tests.
After every stage: re-render, compare to baseline, confirm layout/type/imagery/animation
unchanged, investigate every unintended pixel diff. Mask only genuinely dynamic data
(timestamps) — never mask layout areas to hide regressions.

### Success
Public site looks identical; visitors cannot tell the backend changed; all interactions and
animations still work; new URLs read as natural extensions; SEO content manageable; owner manages
operations and content; no admin can destroy the approved design; CRM/quote/scheduling/invoice/
payment systems work behind the unchanged interface.
