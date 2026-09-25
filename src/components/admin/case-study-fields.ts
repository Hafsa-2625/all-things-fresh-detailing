import type { StoredRecord } from "@/lib/operations/store";
import type { AdminField } from "./resource-manager";

/** Shared by every admin screen that edits case studies, so they all collect what the public template needs. */
export const CASE_STUDY_DESCRIPTION = "Each published case study becomes its own page at /our-work/your-slug and is listed on /our-work. Upload the before and after photos in the media library first. Publishing needs exactly 4 steps, exactly 3 stats, and both photos; the quote card only shows when an approved quote is added.";
export const CASE_STUDY_COLUMNS = ["title", "vehicle", "city", "service", "status"];
export const CASE_STUDY_STATUSES = ["draft", "review", "published", "archived"];

export function caseStudyFields(media: StoredRecord[]): AdminField[] {
  const photoOptions = media
    .filter((row) => String(row.mime_type ?? "").startsWith("image/"))
    .map((row) => ({ value: String(row.id), label: String(row.file_name ?? row.id) }));
  return [
      { name:"title",label:"Title",required:true },{ name:"slug",label:"Slug",required:true },{ name:"vehicle",label:"Vehicle",required:true },{ name:"city",label:"City",required:true },{ name:"service",label:"Service",required:true },{ name:"summary",label:"Summary",type:"textarea",required:true },
      { name:"steps",label:"Steps (exactly 4)",type:"repeater",repeaterFields:[{name:"title",label:"Step"},{name:"note",label:"Note"}] },
      { name:"stats",label:"Stats (exactly 3)",type:"repeater",repeaterFields:[{name:"value",label:"Value"},{name:"label",label:"Label"}] },
      { name:"before_media_id",label:"Before photo",type:"select",options:photoOptions },{ name:"after_media_id",label:"After photo",type:"select",options:photoOptions },
      { name:"approved_quote",label:"Approved customer quote (optional)",type:"textarea" },{ name:"quote_name",label:"Quote from",placeholder:"Marcus, Parma" },{ name:"completed_on",label:"Job date",type:"date" },
      { name:"status",label:"Status",type:"select",options:["draft","review","published"] },
  ];
}
