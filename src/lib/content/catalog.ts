import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

/**
 * Catalog content for the locked public templates: service packages, inclusions and FAQs,
 * add-ons, per-city local detail, and approved reviews.
 *
 * Read with the anon key under RLS (published/approved rows only). Every field is optional:
 * when the database has nothing, the templates keep the versioned content they render today,
 * so an empty or unreachable database never changes the page.
 */

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "all-things-fresh";

export interface ServicePackage { name: string; priceLabel: string; blurb: string }
export interface ServiceInclusion { title: string; note: string }
export interface ServiceFaq { question: string; answer: string }
export interface CatalogAddOn { name: string; priceLabel: string }
export interface CatalogService {
  slug: string;
  name: string;
  packages: ServicePackage[];
  inclusions: ServiceInclusion[];
  faqs: ServiceFaq[];
}
export interface CatalogLocation {
  slug: string;
  city: string;
  neighborhoods: string[];
  differentiators: ServiceInclusion[];
  driveTime: string | null;
  timeOnSite: string | null;
  travelFee: string | null;
  mapQuery: string | null;
}
export interface CatalogReview { name: string; date: string; stars: number; text: string; city: string | null }
export interface SlotMedia { url: string; alt: string; width: number | null; height: number | null }
export interface ReviewSummary { average: string; count: number }
export interface PageCatalog {
  service: CatalogService | null;
  addOns: CatalogAddOn[];
  location: CatalogLocation | null;
  reviews: CatalogReview[];
  reviewSummary: ReviewSummary | null;
}

export const emptyCatalog: PageCatalog = { service: null, addOns: [], location: null, reviews: [], reviewSummary: null };

function client(): SupabaseClient | null {
  return createPublicSupabaseClient();
}

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const rows = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];

/** Tolerant of the two obvious field spellings so hand-entered JSON in the admin still works. */
function packages(value: unknown): ServicePackage[] {
  return rows(value)
    .map((row) => ({
      name: text(row.name ?? row.title),
      priceLabel: text(row.price_label ?? row.priceLabel ?? row.price),
      blurb: text(row.blurb ?? row.description ?? row.note),
    }))
    .filter((entry) => entry.name);
}

function inclusions(value: unknown): ServiceInclusion[] {
  return rows(value)
    .map((row) => ({ title: text(row.title ?? row.name), note: text(row.note ?? row.description ?? row.body) }))
    .filter((entry) => entry.title);
}

function faqs(value: unknown): ServiceFaq[] {
  return rows(value)
    .map((row) => ({ question: text(row.question ?? row.q), answer: text(row.answer ?? row.a) }))
    .filter((entry) => entry.question && entry.answer);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : [];
}

async function loadService(supabase: SupabaseClient, slug: string): Promise<CatalogService | null> {
  const { data, error } = await supabase
    .from("services")
    .select("slug,name,packages,inclusions,faqs")
    .eq("tenant_id", TENANT_ID)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return {
    slug: text(data.slug),
    name: text(data.name),
    packages: packages(data.packages),
    inclusions: inclusions(data.inclusions),
    faqs: faqs(data.faqs),
  };
}

async function loadAddOns(supabase: SupabaseClient, serviceSlug: string): Promise<CatalogAddOn[]> {
  const { data, error } = await supabase
    .from("add_ons")
    .select("name,price_label,applies_to,sort_order")
    .eq("tenant_id", TENANT_ID)
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data
    .filter((row) => {
      const applies = strings(row.applies_to);
      return applies.length === 0 || applies.includes(serviceSlug);
    })
    .map((row) => ({ name: text(row.name), priceLabel: text(row.price_label) }))
    .filter((entry) => entry.name && entry.priceLabel);
}

async function loadLocation(supabase: SupabaseClient, slug: string): Promise<CatalogLocation | null> {
  const { data, error } = await supabase
    .from("locations")
    .select("slug,city,neighborhoods,local_differentiators,drive_time,time_on_site_label,travel_fee_label,map_query")
    .eq("tenant_id", TENANT_ID)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return {
    slug: text(data.slug),
    city: text(data.city),
    neighborhoods: strings(data.neighborhoods),
    differentiators: inclusions(data.local_differentiators),
    driveTime: text(data.drive_time) || null,
    timeOnSite: text(data.time_on_site_label) || null,
    travelFee: text(data.travel_fee_label) || null,
    mapQuery: text(data.map_query) || null,
  };
}

/**
 * Approved reviews, newest first with featured ones first. The rating and count are computed
 * from those rows, never stored, so the rating block can only show what real reviews support.
 */
async function loadReviews(supabase: SupabaseClient): Promise<{ reviews: CatalogReview[]; summary: ReviewSummary | null }> {
  const { data, error } = await supabase
    .from("reviews")
    .select("customer_name,review_date,stars,text,city,featured")
    .eq("tenant_id", TENANT_ID)
    .eq("approved", true)
    .order("featured", { ascending: false })
    .order("review_date", { ascending: false })
    .limit(200);
  if (error || !data?.length) return { reviews: [], summary: null };

  const stars = data.map((row) => Number(row.stars)).filter((value) => Number.isFinite(value) && value > 0);
  const summary = stars.length
    ? { average: (Math.round((stars.reduce((sum, value) => sum + value, 0) / stars.length) * 10) / 10).toFixed(1), count: stars.length }
    : null;
  const reviews = data.slice(0, 3).map((row) => ({
    name: text(row.customer_name),
    date: text(row.review_date),
    stars: Number(row.stars) || 5,
    text: text(row.text),
    city: text(row.city) || null,
  })).filter((review) => review.name && review.text);
  return { reviews, summary };
}

/**
 * Published media by slot id (`media_assets.slot_binding`). Only the slots the approved design
 * exposes can be filled — see src/lib/content/media-slots.ts. Newest upload per slot wins.
 */
export const getSlotMedia = cache(async (): Promise<Record<string, SlotMedia>> => {
  const supabase = client();
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from("media_assets")
      .select("slot_binding,storage_path,alt_text,width,height,created_at")
      .eq("tenant_id", TENANT_ID)
      .not("slot_binding", "is", null)
      .order("created_at", { ascending: false });
    if (error || !data) return {};
    const bySlot: Record<string, SlotMedia> = {};
    for (const row of data) {
      const slot = text(row.slot_binding);
      const url = text(row.storage_path);
      if (!slot || !url || bySlot[slot]) continue;
      bySlot[slot] = { url, alt: text(row.alt_text), width: Number(row.width) || null, height: Number(row.height) || null };
    }
    return bySlot;
  } catch (error) {
    console.warn("[catalog] Could not load slot media; using versioned images.", error);
    return {};
  }
});

/** Cached per request: metadata and the page body both render from it. */
export const getPageCatalog = cache(async ({ serviceSlug, locationSlug }: { serviceSlug?: string; locationSlug?: string }): Promise<PageCatalog> => {
  const supabase = client();
  if (!supabase) return emptyCatalog;
  try {
    const [service, addOns, location, reviewData] = await Promise.all([
      serviceSlug ? loadService(supabase, serviceSlug) : Promise.resolve(null),
      serviceSlug ? loadAddOns(supabase, serviceSlug) : Promise.resolve([]),
      locationSlug ? loadLocation(supabase, locationSlug) : Promise.resolve(null),
      loadReviews(supabase),
    ]);
    return { service, addOns, location, reviews: reviewData.reviews, reviewSummary: reviewData.summary };
  } catch (error) {
    console.warn("[catalog] Could not load published catalog content; using versioned content.", error);
    return emptyCatalog;
  }
});
