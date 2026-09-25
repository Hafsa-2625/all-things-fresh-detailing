import { z } from "zod";

/**
 * tenantConfig — the single source of truth for everything that differs
 * between one detailing-business website and the next. Presentation
 * components must read from this (or from CMS-backed content shaped like
 * it) rather than hardcoding client facts.
 */

const localeSchema = z.enum(["en", "es"]);

const mediaRefSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  /** CSS object-position, e.g. "50% 30%". Lets a non-ideal photo still crop well. */
  focalPoint: z.string().default("50% 50%"),
});

const pricingModeSchema = z.enum(["exact", "starting_at", "quote", "hidden"]);

const serviceSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  category: z.enum(["exterior", "interior", "full", "protection", "specialty"]),
  blurb: z.string(),
  pricingMode: pricingModeSchema,
  price: z.number().optional(),
  media: mediaRefSchema.optional(),
  layout: z.enum(["cinematic", "editorial", "transformation"]).default("editorial"),
});

const trustStatSchema = z.object({
  id: z.string(),
  value: z.string(),
  /** Where this number came from, so it can be verified before launch. Never displayed. */
  source: z.string(),
});

const socialSourceSchema = z.object({
  enabled: z.boolean(),
  url: z.string().url().optional().or(z.literal("")),
  handle: z.string().optional(),
});

const bookingProviderSchema = z.enum([
  "internal",
  "jobber",
  "square",
  "calendly",
  "housecall_pro",
  "fieldd",
  "webhook",
  "custom",
]);

export const tenantConfigSchema = z.object({
  tenantId: z.string().min(1),

  brand: z.object({
    name: z.string(),
    logo: z.string(),
    accent: z.string().regex(/^#/, "accent must be a hex color"),
  }),

  business: z.object({
    legalName: z.string().optional(),
    phone: z.string(),
    email: z.string().email().optional().or(z.literal("")),
    hours: z.string(),
    serviceArea: z.string(),
    locationType: z.enum(["physical", "service_area"]).default("service_area"),
    serviceCities: z.array(z.string()).default([]),
  }),

  languages: z.object({
    enabled: z.array(localeSchema).min(1),
    default: localeSchema,
    allowSwitch: z.boolean().default(true),
  }),

  theme: z.object({
    default: z.enum(["light", "dark", "system"]).default("system"),
    allowSwitch: z.boolean().default(true),
  }),

  media: z.object({
    heroDesktop: mediaRefSchema.optional(),
    heroMobile: mediaRefSchema.optional(),
    heroPoster: mediaRefSchema.optional(),
    filmVideo: z.string().optional(),
  }).default({}),

  services: z.array(serviceSchema).default([]),

  trustStats: z.array(trustStatSchema).default([]),

  booking: z.object({
    provider: bookingProviderSchema,
    mode: z.enum(["inline", "modal", "redirect", "api"]),
    publicUrl: z.string().url().optional().or(z.literal("")),
    webhookUrl: z.string().url().optional().or(z.literal("")),
    depositEnabled: z.boolean().default(false),
  }),

  social: z.object({
    instagram: socialSourceSchema,
    tiktok: socialSourceSchema,
    youtube: socialSourceSchema,
  }),

  reviews: z.object({
    enabled: z.boolean(),
    provider: z.enum(["google", "none"]).default("none"),
    placeId: z.string().optional(),
  }),

  seo: z.object({
    titleTemplate: z.string().default("%s"),
    defaultDescription: z.string().default(""),
    canonicalBase: z.string().url().optional().or(z.literal("")),
  }).default({ titleTemplate: "%s", defaultDescription: "" }),

  analytics: z.object({
    ga4Id: z.string().optional(),
    gtmId: z.string().optional(),
    metaPixelId: z.string().optional(),
    googleAdsId: z.string().optional(),
  }).default({}),

  features: z.object({
    reviews: z.boolean().default(true),
    portfolio: z.boolean().default(true),
    beforeAfter: z.boolean().default(true),
    cinematicVideo: z.boolean().default(true),
    craftsmanship: z.boolean().default(true),
  }),
});

export type TenantConfig = z.infer<typeof tenantConfigSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type Locale = z.infer<typeof localeSchema>;
