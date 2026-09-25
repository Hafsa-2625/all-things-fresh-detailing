import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TenantConfig } from "@/tenant/schema";
import type { SlotMedia } from "@/lib/content/catalog";
import { resolveSocialFeed } from "@/lib/social/content";

const sourcePath = join(process.cwd(), "design-source", "current-zip", "ATF Detail Site.dc.html");
// Plain token (no block-comment delimiters) so bundlers cannot strip it.
const SOCIAL_FEED_SENTINEL = "__ATF_SOCIAL_FEED_JSON__";

// Mobile / tablet rules for the locked design go here (injected before </helmet>).
const responsiveCss = `<style data-atf-responsive="true">
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
  return result;
}

function applyBusinessSettings(markup: string, tenant?: TenantConfig): string {
  if (!tenant) return markup;
  const phoneDigits = tenant.business.phone.replace(/\D/g, "");
  const phone = escapeHtml(tenant.business.phone);
  const instagram = escapeHtml(tenant.social.instagram.url || "https://www.instagram.com/atfcardetailing");
  const tiktok = escapeHtml(tenant.social.tiktok.url || "https://www.tiktok.com/@atfcardetailing1");
  let result = markup
    .replaceAll("440-841-8189", phone)
    .replaceAll("tel:4408418189", `tel:${phoneDigits}`)
    .replaceAll("https://instagram.com/atfcardetailing", instagram)
    .replaceAll("https://www.instagram.com/atfcardetailing", instagram)
    .replaceAll("https://www.tiktok.com/@atfcardetailing1", tiktok)
    .replaceAll("https://www.tiktok.com/@atfcardetailing", tiktok);
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
  markup = markup.replace("</helmet>", `${responsiveCss}</helmet>`);
  markup = markup.replaceAll('src="assets/', 'src="/assets/');
  markup = markup.replaceAll("['assets/", "['/assets/");
  markup = markup.replaceAll("url(assets/", "url(/assets/");
  // Business settings first (hero/footer profile links), then inject feed JSON so
  // per-post TikTok/Instagram URLs are not corrupted by profile URL replaceAll.
  markup = applyBusinessSettings(fillApprovedMediaSlots(connectForms(addFieldNames(markup)), media), tenant);
  markup = markup.replace(/<footer\b[\s\S]*?<\/footer>/i, "");
  return injectSocialFeed(markup, tenant);
}
