import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { SeoPage } from "@/seo/types";
import { buildPagePath } from "@/seo/metadata";
import { getPublishedPages } from "@/seo/registry";
import type { TenantConfig } from "@/tenant/schema";
import { emptyCatalog, type CatalogReview, type PageCatalog } from "@/lib/content/catalog";
import { addMenuToggle } from "@/lib/locked-design/responsive";
import type { CaseStudy } from "@/lib/content/case-studies";

export type LockedTemplate = "service" | "location" | "article" | "case";

const sourcePath = join(process.cwd(), "design-source", "current-zip", "ATF Page Templates.dc.html");

// Mobile / tablet rules for the locked design go here (injected before </helmet>).
const responsiveCss = `<style data-atf-responsive="true">
</style>`;

function html(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function twoLineHeading(value: string): string {
  const words = value.replace(/[.!?]$/, "").split(/\s+/);
  if (words.length < 2) return html(words[0] || value);
  const cut = Math.min(words.length - 1, Math.max(1, Math.ceil(words.length * 0.55)));
  const first = html(words.slice(0, cut).join(" "));
  const second = html(words.slice(cut).join(" ") || words.slice(-1)[0] || "");
  return `${first}<br /><span style="color: #888;">${second}.</span>`;
}

function replaceOnce(source: string, from: string, to: string): string {
  const index = source.indexOf(from);
  if (index < 0) return source;
  return source.slice(0, index) + to + source.slice(index + from.length);
}

function removePreviewHarness(source: string): string {
  const start = source.indexOf('<div style="background: #101112;');
  const publicMain = source.indexOf('<main id="top"', start);
  if (start < 0 || publicMain < 0) return source;
  return source.slice(0, start) + source.slice(publicMain);
}

function connectModal(markup: string, phone: string): string {
  // Embedded in the design runtime's script as a JS string literal.
  const failureMessage = JSON.stringify(`We could not send your request. Please call ${phone}.`).replaceAll("<", "\\u003c");
  const successMessage = JSON.stringify("Request sent — we'll be in touch soon.").replaceAll("<", "\\u003c");
  let result = markup
    .replace('placeholder="Your name"', 'name="name" autocomplete="name" placeholder="Your name"')
    .replace('type="tel" placeholder="(440) 000-0000"', 'name="phone" autocomplete="tel" type="tel" placeholder="(440) 000-0000"')
    .replace('Service<select style="width: 100%; padding: 11px;', 'Service<select name="service" style="width: 100%; padding: 11px;')
    .replace('Preferred date<input required type="date"', 'Preferred date<input name="preferredDate" required type="date"')
    .replace('placeholder="Year, make, model, and anything we should know"', 'name="notes" placeholder="Year, make, model, and anything we should know"');

  result = result.replace(
    "submit: (e) => { e.preventDefault(); this.setState({ sent: true }); },",
    `submit: async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fields = Object.fromEntries(new FormData(form).entries());
      const response = await fetch('/api/leads', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...fields, source: window.location.pathname }),
      });
      if (!response.ok) { this.showToast('error', ${failureMessage}); return; }
      this.showToast('success', ${successMessage});
      this.setState({ sent: true }); form.reset();
    },`,
  );
  return result;
}

function applyCommon(markup: string, page: SeoPage, template: LockedTemplate, tenant?: TenantConfig): string {
  let result = markup
    .replaceAll('src="assets/', 'src="/assets/')
    .replace("state = { template: 'service'", `state = { template: '${template}'`)
    .replace('<a href="#top" style="display: block; padding: 3% 0 0 2.5%;">', '<a href="/" style="display: block; padding: 3% 0 0 2.5%;">')
    .replace('<a href="#top" style="padding: 10px 18px;', '<a href="/" style="padding: 10px 18px;')
    .replace('<a href="#services" style="padding: 10px 13px;', '<a href="/services" style="padding: 10px 13px;')
    .replace('<a href="#work" style="padding: 10px 13px;', '<a href="/our-work" style="padding: 10px 13px;')
    .replace('<a href="#reviews" style="padding: 10px 13px;', '<a href="/reviews" style="padding: 10px 13px;')
    .replace('<a href="#book" style="padding: 10px 13px;', '<a href="/book" style="padding: 10px 13px;');

  result = result.replace("</helmet>", `${responsiveCss}</helmet>`);
  result = addMenuToggle(result);
  const business = businessIdentity(tenant);
  const structured = JSON.stringify({
    "@context": "https://schema.org",
    "@type": page.type === "guide" ? "Article" : page.type === "service" ? "Service" : "WebPage",
    name: page.h1,
    description: page.description,
    url: `${business.baseUrl}${buildPagePath(page)}`,
    provider: page.type === "service" ? { "@type": "LocalBusiness", name: business.name, telephone: business.telephone } : undefined,
    dateModified: page.type === "guide" ? contentDate(page) : undefined,
    author: page.type === "guide" ? { "@type": "Organization", name: business.name } : undefined,
  }).replaceAll("<", "\\u003c");
  result = result.replace("</helmet>", `<script type="application/ld+json">${structured}</script></helmet>`);
  if (tenant) {
    const phoneDigits = tenant.business.phone.replace(/\D/g, "");
    const phone = html(tenant.business.phone);
    const instagram = html(tenant.social.instagram.url || "https://instagram.com/atfcardetailing");
    const tiktok = html(tenant.social.tiktok.url || "https://www.tiktok.com/@atfcardetailing");
    result = result
      .replaceAll("440-841-8189", phone)
      .replaceAll("tel:4408418189", `tel:${phoneDigits}`)
      .replaceAll("https://instagram.com/atfcardetailing", instagram)
      .replaceAll("https://www.tiktok.com/@atfcardetailing", tiktok);
  }
  return connectModal(result, tenant?.business.phone ?? "440-841-8189");
}

/** Name, canonical base URL and E.164-style phone for structured data, from the tenant settings. */
function businessIdentity(tenant?: TenantConfig) {
  const digits = (tenant?.business.phone ?? "440-841-8189").replace(/\D/g, "");
  return {
    name: tenant?.business.legalName ?? "All Things Fresh Auto Detailing",
    baseUrl: (tenant?.seo.canonicalBase || "https://www.allthingsfreshcardetailing.com").replace(/\/$/, ""),
    telephone: digits.length === 10 ? `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` : `+${digits}`,
  };
}

/**
 * Date the versioned registry content was written (docs/FINAL_SEO_REPORT.md).
 * Pages edited in the CMS carry their own `updated_at` instead.
 */
const REGISTRY_CONTENT_DATE = "2026-08-28";

function contentDate(page: SeoPage): string {
  return page.updatedAt ?? REGISTRY_CONTENT_DATE;
}

/** The approved package cards, in order, as they appear in the template. */
const SAMPLE_PACKAGES = [
  { name: "Interior refresh", price: "from $149", blurb: "Vacuum, wipe-down, glass, and mats. Around two hours for a normally used car." },
  { name: "Interior deep clean", price: "from $249", blurb: "Everything above plus steam, hot water extraction, and leather conditioning." },
  { name: "Restoration clean", price: "quoted", blurb: "Pet hair, spills, smoke, mold, or an interior that has not been cleaned in years." },
];

function applyService(markup: string, page: SeoPage, catalog: PageCatalog): string {
  let result = markup
    .replace("Services &middot; Interior", `Services &middot; ${html(page.title)}`)
    .replace('Interior detailing,<br /><span style="color: #888;">at your driveway.</span>', twoLineHeading(page.h1))
    .replace("A full reset of every surface inside your vehicle. We bring our own water, power, and products, so nothing is needed from you.", html(page.intro))
    .replace("Every interior detail covers the same checklist. Heavier jobs take longer, they do not get less attention.", html(page.sections[0]?.body ?? page.intro))
    .replace('Pick your<br /><span style="color: #888;">interior package.</span>', `Choose your<br /><span style="color: #888;">${html(page.title.toLowerCase())}.</span>`)
    .replace("Pricing is by vehicle size and condition. Quote confirmed before we start.", "Pricing is confirmed for your vehicle and its condition before work begins.");

  // Packages come from the published service record when it has them; otherwise the page keeps the
  // generic names and "Custom quote" it shows today (real prices are an owner item).
  const published = catalog.service?.packages ?? [];
  const fallbackNames = [`${page.title} refresh`, `${page.title} premium`, `${page.title} custom`];
  // Without published packages each card keeps exactly what it showed before: the first two say
  // "Custom quote" and the third keeps the template's own "quoted".
  const fallbackPrices = ["Custom quote", "Custom quote", "quoted"];
  SAMPLE_PACKAGES.forEach((sample, index) => {
    const entry = published[index];
    result = replaceOnce(result, sample.name, html(entry?.name || fallbackNames[index]));
    result = replaceOnce(result, sample.price, html(entry?.priceLabel || fallbackPrices[index]));
    if (entry?.blurb) result = replaceOnce(result, sample.blurb, html(entry.blurb));
  });

  // "What is included": published inclusions, else the page's own sections. The first section's body
  // is already the paragraph beside the heading, so the checklist starts at the second one.
  const inclusions = catalog.service?.inclusions ?? [];
  const slots: [string, string, string][] = [
    ["Full vacuum, seats out of the way", page.sections[1]?.heading ?? "Professional equipment", page.sections[1]?.body ?? "We bring the professional tools, water, power, and products needed for the appointment."],
    ["Steam and extraction", page.sections[2]?.heading ?? "Vehicle-safe process", page.sections[2]?.body ?? "Products and methods are selected for the material and condition of your vehicle."],
    ["Leather cleaned and conditioned", page.sections[3]?.heading ?? "Complete service scope", page.sections[3]?.body ?? "Every visit follows the same checklist for the service you booked."],
    ["Every hard surface wiped", "Mobile at your location", "Service is completed at your home or workplace when conditions allow."],
    ["Glass, inside and edges", "Clear scope before work", "We confirm the service, condition, and quote before the detail begins."],
    ["Walk-around before we leave", "Final walk-around", "We inspect the completed work with you and address anything that needs attention."],
  ];
  const oldNotes = [
    "Carpets, mats, seat rails, trunk, and under the seats.",
    "Hot water extraction on cloth, spot treatment on stains.",
    "pH-balanced cleaner, then a matte conditioner.",
    "Dash, vents, console, door cards, cupholders, and jambs.",
    "Streak-free, including the top edge you cannot reach.",
    "We go over the finish together and fix anything you spot.",
  ];
  for (let i = 0; i < slots.length; i += 1) {
    const [oldTitle, title, note] = slots[i];
    const inclusion = inclusions[i];
    result = replaceOnce(result, oldTitle, html(inclusion?.title ?? title));
    result = replaceOnce(result, oldNotes[i], html(inclusion?.note || (inclusion ? "" : note)));
  }

  return applyServiceFaqs(applyAddOns(result, catalog), page, catalog);
}

/** Replaces the add-on price rows when published add-ons exist. Same row markup as the approved template. */
function applyAddOns(markup: string, catalog: PageCatalog): string {
  if (!catalog.addOns.length) return markup;
  const firstRow = markup.lastIndexOf('<div style="display: flex; align-items: baseline;', markup.indexOf("Pet hair removal"));
  const lastRowEnd = markup.indexOf("</div>", markup.indexOf("+$35"));
  if (firstRow < 0 || lastRowEnd < 0) throw new Error("Approved add-on rows were not found in ATF Page Templates.dc.html");
  const rows = catalog.addOns.map((addOn, index) => {
    const divider = index === catalog.addOns.length - 1 ? "" : " border-bottom: 1px solid #efedea; padding-bottom: 14px;";
    return `<div style="display: flex; align-items: baseline; justify-content: space-between; gap: 20px;${divider}">
            <span style="font-size: 14px; font-weight: 700; letter-spacing: -0.02em;">${html(addOn.name)}</span>
            <span style="font-size: 14px; color: #747474;">${html(addOn.priceLabel)}</span>
          </div>`;
  }).join("\n          ");
  return markup.slice(0, firstRow) + rows + markup.slice(lastRowEnd + "</div>".length);
}

/** Replaces the FAQ cards with the service's published FAQs, or the page's own FAQ entries. */
function applyServiceFaqs(markup: string, page: SeoPage, catalog: PageCatalog): string {
  const entries = catalog.service?.faqs.length
    ? catalog.service.faqs
    : (page.faq ?? []).map((entry) => ({ question: entry.question, answer: entry.answer }));
  if (!entries.length) return markup;
  const firstCard = markup.lastIndexOf('<div style="border: 1px solid #e8e8e8; border-radius: 12px; padding: 24px; background: #fff;">', markup.indexOf("Do you need my water or power?"));
  const lastCardEnd = markup.indexOf("</div>", markup.indexOf("Interior work continues in light rain. If it is heavy we reschedule at no charge."));
  if (firstCard < 0 || lastCardEnd < 0) throw new Error("Approved FAQ cards were not found in ATF Page Templates.dc.html");
  const cards = entries.slice(0, 4).map((entry) => `<div style="border: 1px solid #e8e8e8; border-radius: 12px; padding: 24px; background: #fff;">
          <div style="font-size: 14px; font-weight: 700; letter-spacing: -0.02em;">${html(entry.question)}</div>
          <div style="font-size: 12px; color: #747474; line-height: 1.5; margin-top: 6px;">${html(entry.answer)}</div>
        </div>`).join("\n        ");
  // The closing </div> of the fourth card plus its own wrapper close.
  const tailStart = markup.indexOf("</div>", lastCardEnd + "</div>".length) + "</div>".length;
  return markup.slice(0, firstCard) + cards + markup.slice(tailStart);
}

function applyLocation(markup: string, page: SeoPage, catalog: PageCatalog): string {
  const city = page.h1.replace(/^Mobile (car )?detailing in /i, "").replace(/,? OH$/i, "");
  const local = catalog.location;
  // Page content goes in through placeholders so the city-name pass only rewrites the template's own
  // sample text. Replacing "Lakewood" first made the paragraph replacements silently miss (every city
  // showed Lakewood's copy) and would rewrite a genuine mention of Lakewood in another city's content.
  const slots: string[] = [];
  const slot = (value: string) => ` ${slots.push(value) - 1} `;
  const localSlot = (value: string | null | undefined, sample: string) => (value ? slot(html(value)) : sample);
  const differentiators = local?.differentiators ?? [];
  const differentiator = (index: number, sampleTitle: string, sampleNote: string): [string, string, string, string] =>
    [sampleTitle, differentiators[index] ? slot(html(differentiators[index].title)) : sampleTitle,
      sampleNote, differentiators[index]?.note ? slot(html(differentiators[index].note)) : sampleNote];

  let result = markup;
  // Per-city detail from the published location record; each falls back to the template's sample.
  for (const [sampleTitle, title, sampleNote, note] of [
    differentiator(0, "Street-side friendly", "Our setup fits a single parking space, no driveway needed."),
    differentiator(1, "Salt season specialists", "Extraction on carpets, neutraliser on rocker panels."),
    differentiator(2, "No travel fee", "Lakewood is fifteen minutes from our base."),
  ]) {
    result = replaceOnce(result, sampleTitle, title);
    result = replaceOnce(result, sampleNote, note);
  }
  if (local?.neighborhoods.length) {
    result = result.replace(
      "Gold Coast &middot; Clifton Park &middot; Edgewater border &middot; Birdtown &middot; Madison Avenue &middot; Detroit Shoreway border &middot; Scenic Park &middot; Downtown Lakewood &middot; Lakewood Park &middot; Cove &middot; West End &middot; Rockport border",
      slot(local.neighborhoods.map((name) => html(name)).join(" &middot; ")),
    );
  }
  if (local?.mapQuery) {
    result = result.replace("https://www.google.com/maps?q=Lakewood,+Ohio&output=embed", slot(`https://www.google.com/maps?q=${encodeURIComponent(local.mapQuery)}&output=embed`));
  }
  result = result
    .replace(">15 min<", `>${localSlot(local?.driveTime, "15 min")}<`)
    .replace(">2-4 hrs<", `>${localSlot(local?.timeOnSite, "2-4 hrs")}<`)
    .replace(">$0<", `>${localSlot(local?.travelFee, "$0")}<`);

  return result
    .replace("Service area &middot; Cuyahoga County", `Service area &middot; ${slot(html(city))}`)
    .replace('Mobile detailing<br /><span style="color: #888;">in Lakewood, Ohio.</span>', slot(twoLineHeading(page.h1)))
    .replace("We detail on Lakewood streets and in apartment lots every week, from the Gold Coast high-rises down to Birdtown. Tight driveways and street parking are normal here, and we are set up for both.", slot(html(page.intro)))
    .replace("Lakewood is the densest city in Ohio, and it shows in the work. Most of our appointments here are street-side on Clifton, Detroit, or Madison, or in the shared lots behind Gold Coast buildings.", slot(html(page.sections[0]?.body ?? page.intro)))
    .replace("Cars parked outside all winter come to us with Detroit Avenue road salt in the carpets and a film on the lower panels. Spring brings pollen off the Metroparks tree canopy. We plan the visit around whichever one you are dealing with.", slot(html(page.sections[1]?.body ?? "Northeast Ohio road salt, spring pollen, and year-round driving all shape the detail plan for vehicles in this service area.")))
    .replaceAll("Lakewood", html(city))
    .replace(/ (\d+) /g, (_match, index: string) => slots[Number(index)]);
}

/*
 * Article body, rebuilt from page data with the approved prose components only
 * (spec §3: "h2 + paragraph + check-list + price-row"). Styles are copied verbatim
 * from the approved template. The sample body (its "working schedule" card,
 * checklist and closing paragraph) previously stayed on every page underneath the
 * page's own paragraphs.
 */
const ARTICLE_BODY_START = '<p style="color: #4f4f4f; font-size: 18px; line-height: 1.6; margin: 0 0 34px;">Detailing schedules written for California';
const ARTICLE_BODY_END = "Book a full detail, then pick up the seasonal rhythm from there.</p>";
const ARTICLE_LEDE_STYLE = "color: #4f4f4f; font-size: 18px; line-height: 1.6; margin: 0 0 34px;";
const ARTICLE_HEADING_STYLE = "font-size: 28px; line-height: 1.1; letter-spacing: -0.05em; margin: 0 0 14px; font-weight: 700;";
const ARTICLE_PARAGRAPH_STYLE = (margin: string) => `color: #4f4f4f; font-size: 16px; line-height: 1.7; margin: ${margin};`;

const ARTICLE_LABELS = {
  en: { guide: "Resources", faq: "FAQ", other: "All Things Fresh", updated: "Updated", read: (minutes: number) => `${minutes} minute read`, author: "Written by All Things Fresh", dateLocale: "en-GB" },
  es: { guide: "Recursos", faq: "Preguntas frecuentes", other: "All Things Fresh", updated: "Actualizado", read: (minutes: number) => `${minutes} min de lectura`, author: "Escrito por All Things Fresh", dateLocale: "es-ES" },
} as const;

function articleBody(page: SeoPage): string {
  const blocks: string[] = [`<p style="${ARTICLE_LEDE_STYLE}">${html(page.intro)}</p>`];
  const sections = page.sections.map((section) => ({
    heading: section.heading?.trim(),
    paragraphs: section.body.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean),
  }));
  sections.forEach((section, sectionIndex) => {
    if (section.heading) blocks.push(`<h2 style="${ARTICLE_HEADING_STYLE}">${html(section.heading)}</h2>`);
    section.paragraphs.forEach((paragraph, paragraphIndex) => {
      const lastInSection = paragraphIndex === section.paragraphs.length - 1;
      const lastInArticle = lastInSection && sectionIndex === sections.length - 1;
      // Approved rhythm: 18px between paragraphs of one section, 30px after a section, none after the last.
      const margin = lastInArticle ? "0" : lastInSection ? "0 0 30px" : "0 0 18px";
      blocks.push(`<p style="${ARTICLE_PARAGRAPH_STYLE(margin)}">${html(paragraph)}</p>`);
    });
  });
  return blocks.join("\n      ");
}

function readingMinutes(page: SeoPage): number {
  const text = [page.intro, ...page.sections.flatMap((section) => [section.heading ?? "", section.body])].join(" ");
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 200));
}

function applyArticle(markup: string, page: SeoPage): string {
  const labels = page.locale === "es" ? ARTICLE_LABELS.es : ARTICLE_LABELS.en;
  const section = page.type === "guide" ? labels.guide : page.type === "faq" ? labels.faq : labels.other;
  const date = new Intl.DateTimeFormat(labels.dateLocale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${contentDate(page)}T00:00:00Z`));
  // Reading time and author only make sense on articles; other pages keep the update date.
  const meta = page.type === "guide"
    ? `<span>${labels.updated} ${html(date)}</span>
            <span>&middot;</span>
            <span>${html(labels.read(readingMinutes(page)))}</span>
            <span>&middot;</span>
            <span>${html(labels.author)}</span>`
    : `<span>${labels.updated} ${html(date)}</span>`;

  let result = markup
    .replace("Resources &middot; Seasonal care", `${html(section)} &middot; ${html(page.primaryKeyword)}`)
    .replace('How often to detail<br /><span style="color: #888;">a car in Ohio.</span>', twoLineHeading(page.h1))
    .replace(`<span>Updated 14 August 2026</span>
            <span>&middot;</span>
            <span>6 minute read</span>
            <span>&middot;</span>
            <span>Written by All Things Fresh</span>`, meta);

  const start = result.indexOf(ARTICLE_BODY_START);
  const endMarker = result.indexOf(ARTICLE_BODY_END, start);
  if (start < 0 || endMarker < 0) {
    // Fail the build rather than publish the approved template's sample article.
    throw new Error("Approved article body markers were not found in ATF Page Templates.dc.html");
  }
  result = result.slice(0, start) + articleBody(page) + result.slice(endMarker + ARTICLE_BODY_END.length);
  return applyKeepReading(result, page);
}

/*
 * "Keep reading" cards: the approved card component filled with real published pages (the page's
 * related links first, then other resources) instead of the template's three sample cards, which
 * linked to #top.
 */
const KEEP_READING_ANCHOR = 'Keep<br /><span style="color: #888;">reading.</span></h2>';
const KEEP_READING_GRID = '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">';
const KEEP_READING_END = "What dealers actually look at when they walk around your car.</span>\n      </a>";
const KEEP_READING_CARD_STYLE = "display: flex; flex-direction: column; gap: 10px; padding: 24px; border: 1px solid #e7e5e1; border-radius: 14px; background: #fff; transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;";
const KEEP_READING_CARD_HOVER = "transform: translateY(-3px); box-shadow: 0 16px 34px rgba(20,26,40,0.09); border-color: #d8d5d0;";

const RELATED_LABELS: Record<"en" | "es", Record<SeoPage["type"], string>> = {
  en: { service: "Service", location: "Service area", location_service: "Service area", project: "Our work", guide: "Resources", faq: "FAQ", static: "All Things Fresh" },
  es: { service: "Servicio", location: "Zona de servicio", location_service: "Zona de servicio", project: "Nuestro trabajo", guide: "Recursos", faq: "Preguntas frecuentes", static: "All Things Fresh" },
};

function relatedPages(page: SeoPage): SeoPage[] {
  const candidates = getPublishedPages(page.locale).filter((candidate) =>
    candidate.locale === page.locale && !candidate.forceNoindex && !(candidate.type === page.type && candidate.slug === page.slug));
  const picked: SeoPage[] = [];
  const add = (candidate: SeoPage | undefined) => {
    if (candidate && picked.length < 3 && !picked.includes(candidate)) picked.push(candidate);
  };
  for (const reference of page.relatedSlugs) add(candidates.find((candidate) => candidate.type === reference.type && candidate.slug === reference.slug));
  for (const guide of candidates.filter((candidate) => candidate.type === "guide")) add(guide);
  return picked;
}

function applyKeepReading(markup: string, page: SeoPage): string {
  const anchor = markup.indexOf(KEEP_READING_ANCHOR);
  const gridStart = markup.indexOf(KEEP_READING_GRID, anchor);
  const gridEnd = markup.indexOf(KEEP_READING_END, gridStart);
  if (anchor < 0 || gridStart < 0 || gridEnd < 0) {
    throw new Error("Approved \"Keep reading\" markers were not found in ATF Page Templates.dc.html");
  }
  const labels = page.locale === "es" ? RELATED_LABELS.es : RELATED_LABELS.en;
  const cards = relatedPages(page).map((related) => `
      <a href="${html(buildPagePath(related))}" style="${KEEP_READING_CARD_STYLE}" style-hover="${KEEP_READING_CARD_HOVER}">
        <span style="font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #929292; font-weight: 700;">${html(labels[related.type])}</span>
        <strong style="font-size: 17px; font-weight: 700; letter-spacing: -0.03em;">${html(related.title)}</strong>
        <span style="color: #747474; font-size: 12px; line-height: 1.5;">${html(related.description)}</span>
      </a>`).join("");
  return markup.slice(0, gridStart + KEEP_READING_GRID.length) + cards + markup.slice(gridEnd + KEEP_READING_END.length);
}

/** Replaces one exact piece of the approved template, failing loudly if the template no longer contains it. */
function swap(markup: string, find: string, replacement: string, from = 0): string {
  const index = markup.indexOf(find, from);
  if (index < 0) throw new Error(`Approved case-study template is missing: ${find.slice(0, 60)}`);
  return markup.slice(0, index) + replacement + markup.slice(index + find.length);
}

const CASE_SAMPLE_STEPS = [
  ["Cleared and vacuumed the cab", "Seats forward, rear bench out of the way, mats pulled and washed separately."],
  ["Two extraction passes on the carpet", "The first pass came back grey. The second ran close to clear, which is when we stop."],
  ["Decontamination wash outside", "Salt neutraliser on the rockers and arches, then a full contact wash and clay."],
  ["Protection and walk-around", "Sealant on paint, dressing on trim and tires, then a walk-around with the owner."],
];
const CASE_SAMPLE_STATS = [["4 hrs", "On site, one detailer"], ["2", "Extraction passes needed"], ["$0", "Travel fee inside the service area"]];
const CASE_STAT_VALUE = '<div style="font-size: 26px; font-weight: 700; letter-spacing: -0.05em; line-height: 1;">';
const CASE_STAT_LABEL = '<div style="font-size: 11px; color: #8a8a8a; margin-top: 6px; line-height: 1.4;">';
const CASE_STEP_TITLE = '<div style="font-size: 14px; font-weight: 700; letter-spacing: -0.02em;">';
const CASE_STEP_NOTE = '<div style="font-size: 12px; color: #747474; line-height: 1.5; margin-top: 4px;">';

function monthYear(date: string | null): string {
  const parsed = date ? new Date(`${date.slice(0, 10)}T00:00:00Z`) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(parsed);
}

function applyCase(markup: string, page: SeoPage, study?: CaseStudy): string {
  let result = markup
    .replace("Our work &middot; Full detail", `Our work &middot; ${html(study?.service ?? page.primaryKeyword)}`)
    .replace('2016 Silverado,<br /><span style="color: #888;">three winters of salt.</span>', twoLineHeading(page.h1))
    .replace("A work truck used daily on job sites, parked outside through three winters.", html(page.intro));
  if (!study) return result;

  // Other templates in the same file reuse some of this sample copy, so every swap starts inside a case block.
  const CASE_BLOCK = '<sc-if value="{{ isCase }}"';
  const caseHero = result.indexOf(CASE_BLOCK);
  if (caseHero < 0) throw new Error("Approved case-study template blocks were not found");

  result = swap(result, "<span>Parma, OH</span>", `<span>${html(study.city)}</span>`, caseHero);
  result = swap(result, "<span>Full detail</span>", `<span>${html(study.service)}</span>`, caseHero);
  result = swap(result, "<span>4 hours on site</span>", `<span>${html(study.vehicle)}</span>`, caseHero);
  // Located after the hero swaps above, which change the text length before it.
  const caseBody = result.indexOf(CASE_BLOCK, caseHero + CASE_BLOCK.length);
  if (caseBody < 0) throw new Error("Approved case-study template blocks were not found");
  result = swap(result, 'src="/assets/social-detail-2.png" alt="After detailing"', `src="${html(study.after.url)}" alt="${html(study.after.alt)}"`, caseBody);
  result = swap(result, 'src="/assets/social-detail-1.png" alt="Before detailing"', `src="${html(study.before.url)}" alt="${html(study.before.alt)}"`, caseBody);
  CASE_SAMPLE_STEPS.forEach(([title, note], index) => {
    result = swap(result, `${CASE_STEP_TITLE}${title}</div>`, `${CASE_STEP_TITLE}${html(study.steps[index].title)}</div>`, caseBody);
    result = swap(result, `${CASE_STEP_NOTE}${note}</div>`, `${CASE_STEP_NOTE}${html(study.steps[index].note)}</div>`, caseBody);
  });
  CASE_SAMPLE_STATS.forEach(([value, label], index) => {
    result = swap(result, `${CASE_STAT_VALUE}${value}</div>`, `${CASE_STAT_VALUE}${html(study.stats[index].value)}</div>`, caseBody);
    result = swap(result, `${CASE_STAT_LABEL}${label}</div>`, `${CASE_STAT_LABEL}${html(study.stats[index].label)}</div>`, caseBody);
  });

  const quoteStart = result.indexOf('<article style="border-radius: 14px; background: #f4f4f4;', caseBody);
  const quoteEnd = result.indexOf("</article>", quoteStart);
  if (quoteStart < 0 || quoteEnd < 0) throw new Error("Approved case-study template is missing the quote card");
  if (!study.quote) {
    // The template's own rule: a case study publishes with an approved quote or none at all.
    return result.slice(0, quoteStart) + result.slice(quoteEnd + "</article>".length);
  }
  const attribution = [study.service, monthYear(study.completedOn)].filter(Boolean).join(", ");
  let card = result.slice(quoteStart, quoteEnd);
  card = swap(card, 'font-weight: 700;">M</span>', `font-weight: 700;">${html(study.quote.name.charAt(0).toUpperCase())}</span>`);
  card = swap(card, ">Marcus, Parma</span>", `>${html(study.quote.name)}</span>`);
  card = swap(card, ">Full detail, June 2026</span>", `>${html(attribution)}</span>`);
  card = swap(card, "[ Replace with the customer's own words, pulled from the review record in the admin. Case studies publish with an approved quote or none at all. ]", html(study.quote.text));
  return result.slice(0, quoteStart) + card + result.slice(quoteEnd);
}

function resolveTemplateBlocks(markup: string, template: LockedTemplate): string {
  const active = template === "service" ? "Service" : template === "location" ? "Location" : template === "article" ? "Article" : "Case";
  return ["Service", "Location", "Article", "Case"].reduce((result, name) => {
    const pattern = new RegExp(`<sc-if value="\\{\\{ is${name} \\}\\}"[^>]*>([\\s\\S]*?)<\\/sc-if>`, "g");
    return result.replace(pattern, (_match, content: string) => name === active ? content : "");
  }, markup);
}

/**
 * Approved review cards and the rating summary are rendered by the design runtime from the
 * LOCAL_REVIEWS array in its script, so published reviews are written into that array. With no
 * approved reviews the template keeps what it ships with (an owner item).
 */
const REVIEW_AVATAR_COLOURS = ["#1a5fb4", "#d95a00", "#c0392b"];

function reviewDateLabel(review: CatalogReview, locale: SeoPage["locale"]): string {
  if (!review.date) return "";
  const parsed = new Date(`${review.date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return review.date;
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(parsed);
}

function applyReviews(markup: string, page: SeoPage, catalog: PageCatalog): string {
  if (!catalog.reviews.length || !catalog.reviewSummary) return markup;
  const entries = catalog.reviews.map((review, index) => [
    review.name,
    reviewDateLabel(review, page.locale),
    REVIEW_AVATAR_COLOURS[index % REVIEW_AVATAR_COLOURS.length],
    review.text,
  ]);
  const literal = JSON.stringify(entries, null, 2).replaceAll("<", "\\u003c");
  const start = markup.indexOf("const LOCAL_REVIEWS = [");
  const end = markup.indexOf("];", start);
  let result = markup;
  if (start >= 0 && end >= 0) result = `${markup.slice(0, start)}const LOCAL_REVIEWS = ${literal};${markup.slice(end + 2)}`;
  const { average, count } = catalog.reviewSummary;
  const countLabel = page.locale === "es" ? `${count} reseñas` : `${count} review${count === 1 ? "" : "s"}`;
  return result
    .replace('color: #050505;">4.9</span>', `color: #050505;">${html(average)}</span>`)
    .replace(">54 reviews</a>", `>${html(countLabel)}</a>`);
}

export function getLockedSubpageMarkup(
  page: SeoPage,
  template: LockedTemplate,
  tenant?: TenantConfig,
  resolveBlocks = true,
  catalog: PageCatalog = emptyCatalog,
  caseStudy?: CaseStudy,
): string {
  const source = readFileSync(sourcePath, "utf8");
  const match = source.match(/<body>([\s\S]*?)<\/body>/i);
  if (!match) throw new Error("Approved subpage template body was not found");

  let markup = removePreviewHarness(match[1]);
  markup = applyCommon(markup, page, template, tenant);
  if (template === "service") markup = applyService(markup, page, catalog);
  if (template === "location") markup = applyLocation(markup, page, catalog);
  if (template === "article") markup = applyArticle(markup, page);
  if (template === "case") markup = applyCase(markup, page, caseStudy);
  markup = applyReviews(markup, page, catalog);
  return resolveBlocks ? resolveTemplateBlocks(markup, template) : markup;
}

export interface LockedHubItem { href: string; title: string; description: string }

export function getLockedHubMarkup(page: SeoPage, items: LockedHubItem[], tenant?: TenantConfig): string {
  let markup = getLockedSubpageMarkup(page, "article", tenant, false);
  const opening = '<sc-if value="{{ isArticle }}" hint-placeholder-val="{{ false }}">';
  const first = markup.indexOf(opening);
  const second = markup.indexOf(opening, first + opening.length);
  const closing = markup.indexOf("</sc-if>", second + opening.length);
  if (second < 0 || closing < 0) return markup;

  const cards = items.map((item, index) => `<article style="border:1px solid #e7e5e1;border-radius:16px;padding:22px;background:#fff;box-shadow:0 14px 34px rgba(20,26,40,0.05);display:flex;flex-direction:column;gap:14px;min-height:190px;transition:transform .25s ease,box-shadow .25s ease;">
    <span style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#929292;font-weight:700;">${String(index + 1).padStart(2, "0")}</span>
    <h2 style="font-size:24px;letter-spacing:-.05em;line-height:1.05;margin:0;">${html(item.title)}</h2>
    <p style="font-size:12px;line-height:1.55;color:#747474;margin:0;flex:1;">${html(item.description)}</p>
    <a href="${html(item.href)}" style="display:inline-flex;align-items:center;gap:9px;border-bottom:1px solid currentColor;padding-bottom:5px;width:max-content;font-size:12px;font-weight:700;">View page <span aria-hidden="true">→</span></a>
  </article>`).join("");

  const body = `${opening}<section style="padding:70px 30px 100px;background:#fafafa;"><div style="width:min(100%,1120px);margin:auto;"><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;">${cards}</div></div></section>`;
  markup = markup.slice(0, second) + body + markup.slice(closing);
  return resolveTemplateBlocks(markup, "article");
}
