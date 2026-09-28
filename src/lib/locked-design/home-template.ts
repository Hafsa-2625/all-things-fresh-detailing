import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TenantConfig } from "@/tenant/schema";
import type { SlotMedia } from "@/lib/content/catalog";
import { filmVideoUrl } from "@/lib/content/film-video";
import { resolveSocialFeed } from "@/lib/social/content";
import { addMenuToggle, SHARED_RESPONSIVE_RULES } from "@/lib/locked-design/responsive";

const sourcePath = join(process.cwd(), "design-source", "current-zip", "ATF Detail Site.dc.html");
// Plain token (no block-comment delimiters) so bundlers cannot strip it.
const SOCIAL_FEED_SENTINEL = "__ATF_SOCIAL_FEED_JSON__";

// Mobile / tablet rules for the locked design go here (injected before </helmet>).
// Desktop is untouched: everything is inside a max-width query. See responsive.ts.
const responsiveCss = `<style data-atf-responsive="true">${SHARED_RESPONSIVE_RULES}
@media (max-width: 900px) {
  /* Hero: taller than 2.25:1 so the car stays clear of the text and social row. */
  #top [style*="aspect-ratio: 2.25 / 1"] { min-height: 520px !important; }
  #top [style*="margin: 55px 0"] { margin-left: 0 !important; }
  #top [style*="grid-column: 2; display: grid"] { grid-column: 1 / -1 !important; }
}
@media (max-width: 600px) {
  #top [style*="aspect-ratio: 2.25 / 1"] { min-height: calc(370px + 28vw) !important; }
  #top [style*="aspect-ratio: 1163 / 330"] { left: 2% !important; right: 2% !important; }
  #top [style*="left: 3.5%; top: 35%"] { top: 125px !important; left: 30px !important; }
  #top [style*="right: 3.5%; top: 34%"] { top: 262px !important; left: 30px !important; right: auto !important; }
  #top [style*="right: 3.5%; top: 46%"] { top: 296px !important; left: 30px !important; right: auto !important; }
  #top a[aria-label="See our work"] { top: 306px !important; right: 16px !important; }
  #top a[aria-label="Scroll down to services"] { top: 50px !important; left: 130px !important; }
  #top .atf-services-head { flex-direction: column !important; align-items: flex-start !important; }
  #top .atf-services-head > [style*="justify-items: end"] { justify-items: start !important; }
  #top .atf-services-head [style*="text-align: right"] { text-align: left !important; }
  /* Reviews: one card at a time; the arrows already rotate which review comes first. The cards
     share one cell, so it is as tall as the longest review and the rotation never moves the page. */
  #reviews [style*="repeat(3"] > * { grid-area: 1 / 1; }
  #reviews [style*="repeat(3"] > :not(:first-child) { visibility: hidden; }
  #top [style*="grid-template-columns: 1.4fr 1fr 1fr"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  #top [style*="grid-template-columns: 1.4fr 1fr 1fr"] > :first-child { grid-column: 1 / -1; }
  #top form[style*="gap: 30px; padding: 34px"] { padding: 22px !important; }
}
</style>`;

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function addFieldNames(markup: string): string {
  const replacements: Array<[string, string]> = [
    ['placeholder="First name"', 'name="firstName" autocomplete="given-name" placeholder="First name"'],
    ['placeholder="Last name"', 'name="lastName" autocomplete="family-name" placeholder="Last name"'],
    ['type="tel" placeholder="(440) 000-0000"', 'name="phone" autocomplete="tel" type="tel" placeholder="(440) 000-0000"'],
    ['type="email" placeholder="you@email.com"', 'name="email" autocomplete="email" type="email" placeholder="you@email.com"'],
    ['placeholder="Street address"', 'name="street" autocomplete="street-address" placeholder="Street address"'],
    ['placeholder="Optional"', 'name="unit" autocomplete="address-line2" placeholder="Optional"'],
    ['placeholder="City"', 'name="city" autocomplete="address-level2" placeholder="City"'],
    ['placeholder="44101"', 'name="postalCode" autocomplete="postal-code" inputmode="numeric" placeholder="44101"'],
    ['placeholder="e.g. 2019 Honda Accord"', 'name="vehicle" placeholder="e.g. 2019 Honda Accord"'],
    ['placeholder="Your name"', 'name="name" autocomplete="name" placeholder="Your name"'],
    ['placeholder="Year, make, model, and anything we should know"', 'name="notes" placeholder="Year, make, model, and anything we should know"'],
  ];

  let result = markup;
  for (const [from, to] of replacements) result = result.replaceAll(from, to);

  return result
    .replace('<select style="box-sizing: border-box; width: 100%; padding: 14px 15px;', '<select name="state" autocomplete="address-level1" style="box-sizing: border-box; width: 100%; padding: 14px 15px;')
    .replace('What type of detailing are you looking for?<select required', 'What type of detailing are you looking for?<select name="service" required')
    .replace('What are we servicing?<select required', 'What are we servicing?<select name="vehicleType" required')
    .replace('Which day works best for you?<input required type="date"', 'Which day works best for you?<input name="preferredDate" required type="date"')
    .replace('Service<select style="width: 100%; padding: 11px;', 'Service<select name="service" style="width: 100%; padding: 11px;')
    .replace('Preferred date<input required type="date"', 'Preferred date<input name="preferredDate" required type="date"');
}

function connectForms(markup: string): string {
  return markup
    .replace(
      "submitRequest: (e) => { e.preventDefault(); this.setState({ requestSent: true }); },",
      `submitRequest: async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fields = Object.fromEntries(new FormData(form).entries());
        const response = await fetch('/api/leads', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...fields, source: 'homepage-request-form' }),
        });
        if (!response.ok) { this.showToast('error', 'We could not send your request. Please call 440-841-8189.'); return; }
        this.showToast('success', "Request sent \\u2014 we'll be in touch soon.");
        this.setState({ requestSent: true }); form.reset();
      },`,
    )
    .replace(
      "submit: (e) => { e.preventDefault(); this.setState({ sent: true }); },",
      `submit: async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fields = Object.fromEntries(new FormData(form).entries());
        const response = await fetch('/api/leads', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...fields, source: 'homepage-booking-modal' }),
        });
        if (!response.ok) { this.showToast('error', 'We could not send your request. Please call 440-841-8189.'); return; }
        this.showToast('success', "Request sent \\u2014 we'll be in touch soon.");
        this.setState({ sent: true }); form.reset();
      },`,
    );
}

/**
 * Fills the approved image slots. A photo uploaded in the admin against the slot id replaces the
 * versioned image; with nothing uploaded the page keeps the images it ships with (the generated
 * placeholders the owner is asked to replace).
 */
function fillApprovedMediaSlots(markup: string, media: Record<string, SlotMedia> = {}): string {
  const versioned: Record<string, { src: string; alt: string }> = {
    "svc-interior-media": { src: "/assets/service-interior-generated.png", alt: "Professional steam cleaning a vehicle interior" },
    "svc-exterior-media": { src: "/assets/service-exterior-generated.png", alt: "Professional polishing deep blue automotive paint" },
    "svc-full-media": { src: "/assets/service-full-generated.png", alt: "Freshly detailed navy classic car in a driveway" },
  };

  let result = markup;
  for (const [id, fallback] of Object.entries(versioned)) {
    const published = media[id];
    const src = escapeHtml(published?.url || fallback.src);
    const alt = escapeHtml(published?.alt || fallback.alt);
    const pattern = new RegExp(`<image-slot id="${id}"[\\s\\S]*?<\\/image-slot>`, "i");
    result = result.replace(pattern, `<img src="${src}" alt="${alt}" loading="lazy" decoding="async" style="display:block;width:100%;height:100%;object-fit:cover;" />`);
  }
  return fillComparePhotos(result, media);
}

/*
 * The before/after comparison photos. The originals are 2752x1536 JPEGs of ~3.5 MB; the page serves
 * WebP resizes built by scripts/optimize-compare-photos.mjs (same widths as below).
 */
const COMPARE_WIDTHS = [640, 960, 1440, 1920, 2560];
// The box is 520px tall (360px on phones) and the photos cover it, so below ~990px they are drawn
// wider than the box: 520 x 2752/1536 = 932px, and 645px on phones. Above that the box width wins.
const COMPARE_SIZES = "(max-width: 600px) 645px, (max-width: 992px) 932px, (max-width: 1180px) calc(100vw - 60px), 1120px";
// Exactly as the approved source ships them, after the /assets/ path rewrite.
const COMPARE_PHOTOS = [
  { slot: "compare-before", tag: '<img src="/assets/compare/before.jpg" alt="Before detailing" draggable="false"', file: "before", alt: "Before detailing" },
  { slot: "compare-after", tag: '<img src="/assets/compare/after.jpg" alt="After detailing" draggable="false"', file: "after", alt: "After detailing" },
];

function fillComparePhotos(markup: string, media: Record<string, SlotMedia>): string {
  let result = markup;
  for (const photo of COMPARE_PHOTOS) {
    if (!result.includes(photo.tag)) throw new Error(`Approved comparison photo was not found: ${photo.file}`);
    const published = media[photo.slot];
    // An upload is a single file; the versioned photo comes in several widths.
    const source = published
      ? `src="${escapeHtml(published.url)}"`
      : `src="/assets/compare/${photo.file}-1440.webp" srcset="${COMPARE_WIDTHS.map((width) => `/assets/compare/${photo.file}-${width}.webp ${width}w`).join(", ")}" sizes="${COMPARE_SIZES}"`;
    result = result.replace(photo.tag, `<img ${source} alt="${escapeHtml(published?.alt || photo.alt)}" loading="lazy" decoding="async" draggable="false"`);
  }
  return result;
}

/**
 * The comparison slider is drag-only in the design. This adds arrow / Home / End keys for keyboard
 * users; nothing changes visually (the browser's focus ring shows only for keyboard focus).
 */
function makeComparisonKeyboardAccessible(markup: string): string {
  const box = '<div ref="{{ compareRef }}" onPointerDown="{{ startDrag }}"';
  const values = "      compareRef: (el) => { this.compareEl = el; },";
  if (!markup.includes(box) || !markup.includes(values)) throw new Error("Approved comparison slider was not found");
  return markup
    .replace(box, `${box} tabindex="0" role="slider" aria-label="Before and after photos" aria-valuemin="2" aria-valuemax="98" aria-valuenow="{{ comparePos }}" onKeyDown="{{ compareKey }}"`)
    .replace(values, () => `${values}
      comparePos: Math.round(this.state.pos),
      compareKey: (e) => {
        const step = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 }[e.key];
        const to = e.key === 'Home' ? 2 : e.key === 'End' ? 98 : step ? Math.max(2, Math.min(98, this.state.pos + step)) : null;
        if (to === null) return;
        e.preventDefault();
        this.setState({ pos: to });
      },`);
}

/**
 * Sets default values of the design's own props (the `data-props` metadata the design runtime reads
 * its defaults from), so the server markup and the booted page agree.
 */
function setDesignProps(markup: string, values: Record<string, unknown>): string {
  const match = markup.match(/<script type="text\/x-dc" data-dc-script data-props="([^"]*)">/);
  if (!match) throw new Error("Homepage design props were not found");
  const props = JSON.parse(match[1].replaceAll("&quot;", '"').replaceAll("&amp;", "&")) as Record<string, { default?: unknown }>;
  for (const [name, value] of Object.entries(values)) {
    if (!props[name]) throw new Error(`Homepage design prop "${name}" does not exist`);
    props[name].default = value;
  }
  const encoded = JSON.stringify(props).replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  return markup.replace(match[0], () => match[0].replace(match[1], () => encoded));
}

const FILM_PLAYER = /<sc-if value="\{\{ videoPlaying \}\}"[^>]*>[\s\S]*?<\/sc-if>/;
const FILM_PLACEHOLDER = /<sc-if value="\{\{ noVideo \}\}"[^>]*>[\s\S]*?<\/sc-if>/;
const FILM_SRC = 'src="{{ videoSrc }}"';

/**
 * The film section plays the tenant's video through the design's own `youtubeUrl` prop, which
 * builds the muted, looping, chrome-free YouTube or Vimeo embed. Every `sc-if` branch of the raw
 * template shows until the runtime boots, so the branch that will not render is dropped here;
 * otherwise the placeholder flashes before the video. The iframe's src goes through the runtime's
 * camel-case attribute, which the browser ignores, so the player loads once, after boot, and never
 * requests the literal "{{ videoSrc }}".
 */
function applyFilmVideo(markup: string, tenant?: TenantConfig): string {
  const player = markup.match(FILM_PLAYER)?.[0];
  const placeholder = markup.match(FILM_PLACEHOLDER)?.[0];
  if (!player || !placeholder || !player.includes(FILM_SRC)) throw new Error("Approved film section was not found");
  const url = filmVideoUrl(tenant?.media.filmVideo);
  if (!url) return markup.replace(player, "");
  const deferredPlayer = player.replace(FILM_SRC, 'sc-camel-src="{{ videoSrc }}"');
  return setDesignProps(markup.replace(placeholder, "").replace(player, () => deferredPlayer), { youtubeUrl: url });
}

const INSTAGRAM_SECTION = /<sc-if value="\{\{ showIgFeed \}\}"[^>]*>\s*<section id="work"[\s\S]*?<\/section>\s*<\/sc-if>/;
// The Instagram glyph, as the Follow button (17px) and the card brand mark (16px) draw it.
const INSTAGRAM_ICON = /(<svg width="1[67]" height="1[67]" viewBox="0 0 24 24") fill="none"( aria-hidden="true")?><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.7"\/><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.7"\/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"\/><\/svg>/g;
// The design's own TikTok glyph, from the hero's social links.
const TIKTOK_PATH = '<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.68v13.67a2.4 2.4 0 1 1-4.33-2.4 2.4 2.4 0 0 1 .82 1.77V9.5a6 6 0 1 0 5.83 3.9V6.69Z"/>';
const INSTAGRAM_STATS = "<div><strong>{{ igPostsCount }}</strong><span>posts</span></div>\n        <div><strong>{{ igFollowers }}</strong><span>followers</span></div>";
const TIKTOK_STATS = "<div><strong>{{ ttFollowers }}</strong><span>followers</span></div>\n        <div><strong>{{ ttLikes }}</strong><span>likes</span></div>";

/** Script edits that give the TikTok rail the Instagram rail's state, ref, arrows and values. */
const TIKTOK_SCRIPT: Array<[string, string]> = [
  ["    igAtEnd: true,\n", "    igAtEnd: true,\n    ttCanScroll: false,\n    ttAtStart: true,\n    ttAtEnd: true,\n"],
  ["    if (key === 'ig') this.igCarousel = el;\n", "    if (key === 'ig') this.igCarousel = el;\n    if (key === 'tt') this.ttCarousel = el;\n"],
  ["    this.unbindRail('ig');\n", "    this.unbindRail('ig');\n    this.unbindRail('tt');\n"],
  [
    "    const igPosts = mapSocialPosts(feed.instagram.posts);\n",
    "    const igPosts = mapSocialPosts(feed.instagram.posts);\n    const ttProfile = (feed.tiktok && feed.tiktok.profile) || {};\n    const ttPosts = mapSocialPosts(feed.tiktok && feed.tiktok.posts);\n",
  ],
  [
    "      showIgNext: this.state.igCanScroll && !this.state.igAtEnd,\n",
    `      showIgNext: this.state.igCanScroll && !this.state.igAtEnd,
      showTtFeed: ttPosts.length > 0,
      ttName: ttProfile.name || '',
      ttHandle: ttProfile.handle || '',
      ttUrl: ttProfile.url || 'https://www.tiktok.com/@atfcardetailing1',
      ttAvatar: ttProfile.avatar || '/assets/tiktok/avatar.webp',
      ttFollowers: ttProfile.followers || '',
      ttLikes: ttProfile.likes || '',
      ttShowStats: !!(ttProfile.followers || ttProfile.likes),
      ttPosts,
      ttCarouselRef: (el) => this.bindRail('tt', el),
      scrollTtLeft: () => scrollRail(this.ttCarousel, -1),
      scrollTtRight: () => scrollRail(this.ttCarousel, 1),
      showTtPrev: this.state.ttCanScroll && !this.state.ttAtStart,
      showTtNext: this.state.ttCanScroll && !this.state.ttAtEnd,
`,
  ],
];

/**
 * The TikTok feed is the Instagram section (`#work`) with its `ig*` bindings renamed to `tt*`: the
 * same classes, card sizes, hover overlay and arrows, so the two read as one component. What
 * differs is TikTok's own data (followers and likes in place of posts and followers), glyph and red
 * Follow button. It sits directly below Instagram, and is left out when the account is disabled.
 *
 * Both feeds' images go through the runtime's camel-case attribute, which the browser ignores, so
 * the raw template shown before boot never requests the literal "{{ post.src }}" or avatar URL.
 */
function addTikTokFeed(markup: string, showTikTok: boolean): string {
  const instagram = markup.match(INSTAGRAM_SECTION)?.[0];
  if (!instagram || !instagram.includes(INSTAGRAM_STATS) || instagram.match(INSTAGRAM_ICON)?.length !== 3) {
    throw new Error("Approved Instagram section was not found");
  }
  const deferred = instagram.replaceAll('src="{{ igAvatar }}"', 'sc-camel-src="{{ igAvatar }}"').replace('src="{{ post.src }}"', 'sc-camel-src="{{ post.src }}"');
  if (!showTikTok) return markup.replace(instagram, () => deferred);

  let script = markup;
  for (const [from, to] of TIKTOK_SCRIPT) {
    if (!script.includes(from)) throw new Error(`Homepage social script changed: ${from.trim()}`);
    script = script.replace(from, () => to);
  }
  const tiktok = deferred
    .replace('<section id="work" class="atf-social atf-social--instagram">', '<section id="tiktok" class="atf-social atf-social--tiktok">')
    .replace(INSTAGRAM_STATS, TIKTOK_STATS)
    .replace(INSTAGRAM_ICON, (_, open: string, hidden = "") => `${open} fill="currentColor"${hidden}>${TIKTOK_PATH}</svg>`)
    .replace("atf-social__follow--ig", "atf-social__follow--tt")
    .replaceAll("{{ ig", "{{ tt")
    .replaceAll("{{ showIg", "{{ showTt")
    .replaceAll("{{ scrollIg", "{{ scrollTt")
    .replaceAll(" Instagram posts", " TikTok posts");
  if (/\{\{ (ig|showIg|scrollIg)|Instagram|--ig\b|--instagram/.test(tiktok)) throw new Error("TikTok section still refers to Instagram");
  return script.replace(instagram, () => `${deferred}\n\n${tiktok}`);
}

function applyBusinessSettings(markup: string, tenant?: TenantConfig): string {
  if (!tenant) return markup;
  const phoneDigits = tenant.business.phone.replace(/\D/g, "");
  const phone = escapeHtml(tenant.business.phone);
  const instagram = escapeHtml(tenant.social.instagram.url || "https://www.instagram.com/atfcardetailing");
  const tiktok = escapeHtml(tenant.social.tiktok.url || "https://www.tiktok.com/@atfcardetailing1");
  // One pass per platform: a URL that starts with the default one (".../atfcardetailing.cle") must
  // not be matched again and doubled once it has been written in.
  let result = markup
    .replaceAll("440-841-8189", phone)
    .replaceAll("tel:4408418189", `tel:${phoneDigits}`)
    .replace(/https:\/\/(?:www\.)?instagram\.com\/atfcardetailing/g, () => instagram)
    .replace(/https:\/\/www\.tiktok\.com\/@atfcardetailing1?/g, () => tiktok);
  const customerCount = tenant.trustStats.find((item) => item.id === "happyCustomers")?.value;
  if (customerCount) result = result.replaceAll("+500", escapeHtml(customerCount.startsWith("+") ? customerCount : `+${customerCount.replace(/\+$/, "")}`));
  return result;
}

/** Injects Car Bros-style Instagram/TikTok feed JSON into the locked homepage DC script. */
function injectSocialFeed(markup: string, tenant?: TenantConfig): string {
  if (!markup.includes(SOCIAL_FEED_SENTINEL)) {
    throw new Error("Homepage social-feed sentinel was not found");
  }
  return markup.replace(SOCIAL_FEED_SENTINEL, JSON.stringify(resolveSocialFeed(tenant)));
}

export function getLockedHomeMarkup(tenant?: TenantConfig, media: Record<string, SlotMedia> = {}): string {
  const source = readFileSync(sourcePath, "utf8");
  const match = source.match(/<body>([\s\S]*?)<\/body>/i);
  if (!match) throw new Error("Approved homepage body was not found");

  let markup = match[1];
  markup = setDesignProps(markup, { showComparison: true });
  markup = makeComparisonKeyboardAccessible(markup);
  markup = applyFilmVideo(markup, tenant);
  markup = addTikTokFeed(markup, resolveSocialFeed(tenant).tiktok.posts.length > 0);
  markup = markup.replace("</helmet>", `${responsiveCss}</helmet>`);
  markup = addMenuToggle(markup);
  markup = markup.replaceAll('src="assets/', 'src="/assets/');
  markup = markup.replaceAll("['assets/", "['/assets/");
  markup = markup.replaceAll("url(assets/", "url(/assets/");
  // Business settings first (hero/footer profile links), then inject feed JSON so
  // per-post TikTok/Instagram URLs are not corrupted by profile URL replaceAll.
  markup = applyBusinessSettings(fillApprovedMediaSlots(connectForms(addFieldNames(markup)), media), tenant);
  markup = markup.replace(/<footer\b[\s\S]*?<\/footer>/i, "");
  return injectSocialFeed(markup, tenant);
}
