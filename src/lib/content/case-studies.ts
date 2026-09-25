import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { SlotMedia } from "@/lib/content/catalog";
import type { SeoPage } from "@/seo/types";

/**
 * Case studies from the admin, rendered through the locked case-study template. The template has a
 * fixed shape — four steps, three stats, a before and an after photo — so a record only publishes
 * when it fills every slot. Nothing from the template's sample job can leak onto a real page.
 */

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "all-things-fresh";
export const CASE_STUDY_STEPS = 4;
export const CASE_STUDY_STATS = 3;

export interface CaseStudyStep { title: string; note: string }
export interface CaseStudyStat { value: string; label: string }
export interface CaseStudy {
  slug: string;
  title: string;
  vehicle: string;
  city: string;
  service: string;
  summary: string;
  steps: CaseStudyStep[];
  stats: CaseStudyStat[];
  before: SlotMedia;
  after: SlotMedia;
  quote: { text: string; name: string } | null;
  completedOn: string | null;
  updatedAt: string | null;
}

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const rows = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];

export function caseStudySteps(value: unknown): CaseStudyStep[] {
  return rows(value).map((row) => ({ title: text(row.title ?? row.name), note: text(row.note ?? row.description ?? row.body) }));
}

export function caseStudyStats(value: unknown): CaseStudyStat[] {
  return rows(value).map((row) => ({ value: text(row.value), label: text(row.label ?? row.note) }));
}

/** Why a case study cannot be published yet. Empty when every template slot is filled. */
export function caseStudyProblems(values: Record<string, unknown>): string[] {
  const problems: string[] = [];
  const steps = caseStudySteps(values.steps);
  const stats = caseStudyStats(values.stats);
  if (steps.length !== CASE_STUDY_STEPS || steps.some((step) => !step.title || !step.note)) {
    problems.push(`Steps need exactly ${CASE_STUDY_STEPS} entries, each with a title and a note.`);
  }
  if (stats.length !== CASE_STUDY_STATS || stats.some((stat) => !stat.value || !stat.label)) {
    problems.push(`Stats need exactly ${CASE_STUDY_STATS} entries, each with a value and a label.`);
  }
  if (!text(values.before_media_id) || !text(values.after_media_id)) problems.push("Choose a before photo and an after photo.");
  if (text(values.approved_quote) && !text(values.quote_name)) problems.push("Add who the quote is from (for example “Marcus, Parma”).");
  return problems;
}

type Row = Record<string, unknown>;

async function mediaById(supabase: SupabaseClient, ids: string[]): Promise<Map<string, SlotMedia>> {
  if (!ids.length) return new Map();
  const { data, error } = await supabase.from("media_assets").select("id,storage_path,alt_text,width,height,mime_type").in("id", ids);
  if (error || !data) return new Map();
  return new Map(
    data
      .filter((row) => text(row.storage_path) && text(row.mime_type).startsWith("image/"))
      .map((row) => [String(row.id), { url: text(row.storage_path), alt: text(row.alt_text), width: Number(row.width) || null, height: Number(row.height) || null }]),
  );
}

function toCaseStudy(row: Row, media: Map<string, SlotMedia>): CaseStudy | null {
  if (caseStudyProblems(row).length) return null;
  const before = media.get(text(row.before_media_id));
  const after = media.get(text(row.after_media_id));
  const title = text(row.title);
  const summary = text(row.summary);
  if (!before || !after || !title || !summary) return null;
  const quoteText = text(row.approved_quote);
  return {
    slug: text(row.slug),
    title,
    vehicle: text(row.vehicle),
    city: text(row.city),
    service: text(row.service),
    summary,
    steps: caseStudySteps(row.steps),
    stats: caseStudyStats(row.stats),
    before,
    after,
    quote: quoteText ? { text: quoteText, name: text(row.quote_name) } : null,
    completedOn: text(row.completed_on) || null,
    updatedAt: text(row.updated_at).slice(0, 10) || null,
  };
}

const COLUMNS = "slug,title,vehicle,city,service,summary,steps,stats,before_media_id,after_media_id,approved_quote,quote_name,completed_on,updated_at";

/** Published case studies that fill every template slot, newest job first. */
export const listCaseStudies = cache(async (): Promise<CaseStudy[]> => {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("case_studies")
      .select(COLUMNS)
      .eq("tenant_id", TENANT_ID)
      .eq("status", "published")
      .order("completed_on", { ascending: false, nullsFirst: false })
      .limit(200);
    if (error || !data) return [];
    const media = await mediaById(supabase, [...new Set(data.flatMap((row) => [text(row.before_media_id), text(row.after_media_id)]).filter(Boolean))]);
    return data.map((row) => toCaseStudy(row, media)).filter((study): study is CaseStudy => study !== null);
  } catch (error) {
    console.warn("[case-studies] Could not load published case studies.", error);
    return [];
  }
});

export async function findCaseStudy(slug: string): Promise<CaseStudy | null> {
  return (await listCaseStudies()).find((study) => study.slug === slug) ?? null;
}

export function caseStudyPage(study: CaseStudy): SeoPage {
  return {
    type: "project",
    locale: "en",
    slug: study.slug,
    status: "published",
    clusterId: `case-study-${study.slug}`,
    primaryKeyword: study.service,
    secondaryKeywords: [],
    intent: ["commercial", "informational"],
    title: `${study.title} | ${study.service} in ${study.city}`,
    description: study.summary.slice(0, 160),
    h1: study.title,
    intro: study.summary,
    sections: [{ body: study.summary }],
    relatedSlugs: [],
    schema: ["Article", "BreadcrumbList"],
    updatedAt: study.updatedAt ?? undefined,
  };
}
