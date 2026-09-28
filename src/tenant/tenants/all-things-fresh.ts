import type { TenantConfig } from "../schema";

/**
 * Reference tenant: confirmed business facts (phone, hours, service area, booking URL, social
 * handles) plus copy captured from the approved design mockup (service names, package tiers,
 * service-area city list).
 *
 * Most trustStats below are carried over from the mockup's hero/trust-bar copy.
 * The 500+ customer figure is also stated on the official live business site and
 * was verified there on 2026-08-28. See `source` on each statistic.
 *
 * fleet-dealership and boat-detailing were added from the original mockup's own
 * nav/footer links ("Fleet & Dealership", "Boat Services") — real business
 * lines the client already advertises, not invented services.
 */
export const allThingsFreshTenant: TenantConfig = {
  tenantId: "all-things-fresh",

  brand: {
    name: "All Things Fresh",
    logo: "/brand/all-things-fresh/logo.svg",
    accent: "#14120d",
  },

  business: {
    legalName: "All Things Fresh Mobile Car Detailing",
    phone: "440-841-8189",
    email: "",
    hours: "Monday – Sunday, 10:00 AM – 9:00 PM",
    serviceArea: "Greater Cleveland, OH",
    locationType: "service_area",
    serviceCities: [
      "Cleveland, OH",
      "Rocky River, OH",
      "Westlake, OH",
      "Avon, OH",
      "Bay Village, OH",
      "Lakewood, OH",
      "North Olmsted, OH",
    ],
  },

  languages: {
    enabled: ["en", "es"],
    default: "en",
    allowSwitch: true,
  },

  theme: {
    default: "system",
    allowSwitch: true,
  },

  media: {
    filmVideo: "https://vimeo.com/1182495984",
  },

  services: [
    { id: "full-maintenance", slug: "full-maintenance", name: "Full Maintenance", category: "full", blurb: "A complete interior and exterior refresh for regular upkeep.", pricingMode: "starting_at", layout: "editorial" },
    { id: "gold-premium", slug: "gold-premium", name: "Gold Premium", category: "full", blurb: "A deeper full-detail package for vehicles that need extra attention.", pricingMode: "starting_at", layout: "editorial" },
    { id: "masterpiece-detail", slug: "masterpiece-detail", name: "Masterpiece Detail", category: "full", blurb: "The complete top-tier detail, inside and out.", pricingMode: "quote", layout: "cinematic" },
    { id: "exterior-maintenance", slug: "exterior-maintenance", name: "Exterior Maintenance", category: "exterior", blurb: "Wash, dry, and finish to keep the outside looking sharp.", pricingMode: "starting_at", layout: "editorial" },
    { id: "wax-buff", slug: "wax-buff", name: "Wax & Buff", category: "exterior", blurb: "Hand wax and buff for a deep, protective shine.", pricingMode: "starting_at", layout: "editorial" },
    { id: "ceramic-coating", slug: "ceramic-coating", name: "Ceramic Coating", category: "protection", blurb: "Long-lasting protection with an extreme, glass-like gloss.", pricingMode: "quote", layout: "cinematic" },
    { id: "paint-protection-film", slug: "paint-protection-film", name: "Paint Protection Film", category: "protection", blurb: "Clear physical protection for impact-prone painted surfaces.", pricingMode: "quote", layout: "cinematic" },
    { id: "window-tinting", slug: "window-tinting", name: "Window Tinting", category: "protection", blurb: "Professional automotive window tinting, quoted for your vehicle.", pricingMode: "quote", layout: "editorial" },
    { id: "interior-maintenance", slug: "interior-maintenance", name: "Interior Maintenance", category: "interior", blurb: "Vacuum, wipe-down, and refresh for everyday interior upkeep.", pricingMode: "starting_at", layout: "editorial" },
    { id: "deep-shampoo", slug: "deep-shampoo", name: "Deep Shampoo", category: "interior", blurb: "Deep-cleaned carpets and upholstery, restored.", pricingMode: "starting_at", layout: "editorial" },
    { id: "mold-reset", slug: "mold-reset", name: "Mold Reset", category: "interior", blurb: "A full interior reset for vehicles with mold or odor issues.", pricingMode: "quote", layout: "transformation" },
    { id: "fleet-dealership", slug: "fleet-dealership", name: "Fleet & Dealership", category: "specialty", blurb: "Recurring detailing programs for dealership lots and company fleets.", pricingMode: "quote", layout: "editorial" },
    { id: "boat-detailing", slug: "boat-detailing", name: "Boat Detailing", category: "specialty", blurb: "Hull, deck, and interior detailing for boats, brought to your marina or driveway.", pricingMode: "quote", layout: "editorial" },
  ],

  trustStats: [
    { id: "vehiclesPerMonth", value: "75+", source: "mockup hero copy — unverified, confirm with client" },
    { id: "happyCustomers", value: "500+", source: "official live business site and approved mockup — verified 2026-08-28" },
    { id: "openDays", value: "7", source: "mockup trust-bar copy — matches business.hours, safe to keep" },
    { id: "satisfaction", value: "100%", source: "mockup trust-bar copy — policy claim, confirm wording with client" },
  ],

  booking: {
    provider: "fieldd",
    mode: "redirect",
    publicUrl: "https://allthingsfreshmobilecardetailing.fieldd.co/",
    webhookUrl: "",
    depositEnabled: false,
  },

  social: {
    instagram: { enabled: true, url: "https://www.instagram.com/atfcardetailing", handle: "@atfcardetailing" },
    tiktok: { enabled: true, url: "https://www.tiktok.com/@atfcardetailing1", handle: "@atfcardetailing1" },
    youtube: { enabled: false, url: "" },
  },

  reviews: {
    enabled: true,
    provider: "none",
  },

  seo: {
    titleTemplate: "%s | All Things Fresh Mobile Detailing",
    defaultDescription: "Premium mobile car detailing across Greater Cleveland, OH — ceramic coating, paint correction, and full interior/exterior detailing at home or in the shop.",
    canonicalBase: "https://www.allthingsfreshcardetailing.com",
  },

  analytics: {},

  features: {
    reviews: true,
    portfolio: true,
    beforeAfter: true,
    cinematicVideo: true,
    craftsmanship: true,
  },
};
