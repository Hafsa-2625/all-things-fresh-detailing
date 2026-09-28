"use server";

import { revalidatePath } from "next/cache";
import { tenantConfigSchema, type TenantConfig } from "@/tenant/schema";
import { getLatestConfigForEditing } from "@/tenant/admin-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStaff, canWrite } from "@/lib/admin/session";
import { canonicalFilmVideoUrl } from "@/lib/content/film-video";

export interface WebsiteFormState {
  status: "idle" | "saved" | "published" | "error";
  message?: string;
}

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "all-things-fresh";

function applyFormPatch(base: TenantConfig, formData: FormData): TenantConfig {
  const str = (key: string, fallback: string) => (formData.get(key)?.toString() ?? fallback);
  const flag = (key: string) => formData.get(key) === "on";

  return tenantConfigSchema.parse({
    ...base,
    business: {
      ...base.business,
      phone: str("phone", base.business.phone),
      email: str("email", base.business.email ?? ""),
      hours: str("hours", base.business.hours),
      serviceArea: str("serviceArea", base.business.serviceArea),
    },
    theme: base.theme,
    features: base.features,
    booking: {
      ...base.booking,
      publicUrl: str("bookingUrl", base.booking.publicUrl ?? ""),
    },
    social: {
      instagram: { ...base.social.instagram, enabled: flag("instagram_enabled"), url: str("instagram_url", base.social.instagram.url ?? "") },
      tiktok: { ...base.social.tiktok, enabled: flag("tiktok_enabled"), url: str("tiktok_url", base.social.tiktok.url ?? "") },
      youtube: { ...base.social.youtube, enabled: flag("youtube_enabled"), url: str("youtube_url", base.social.youtube.url ?? "") },
    },
    media: {
      ...base.media,
      // Empty clears it, and the homepage film section falls back to its placeholder.
      filmVideo: formData.has("filmVideo") ? canonicalFilmVideoUrl(str("filmVideo", "")) || undefined : base.media.filmVideo,
    },
  });
}

async function writeConfig(
  formData: FormData,
  status: "draft" | "published",
): Promise<WebsiteFormState> {
  const profile = await requireStaff();
  if (!canWrite(profile.role)) {
    return { status: "error", message: "Your role (editor) can view but not change site settings — ask a manager or admin." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "No database connected — see docs/architecture.md." };
  }

  const { row, config: current } = await getLatestConfigForEditing(TENANT_ID);

  let next: TenantConfig;
  try {
    next = applyFormPatch(current, formData);
  } catch (err) {
    return { status: "error", message: `Validation failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  const { error } = await supabase.from("tenant_configs").insert({
    tenant_id: TENANT_ID,
    status,
    version: (row?.version ?? 0) + 1,
    config: next,
    updated_by: profile.id,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  await supabase.from("audit_log").insert({
    actor: profile.id,
    action: status === "published" ? "tenant_config.publish" : "tenant_config.save_draft",
    entity: "tenant_configs",
    entity_id: TENANT_ID,
  });

  revalidatePath("/admin/website");
  if (status === "published") {
    revalidatePath("/[lang]", "layout");
  }

  return {
    status: status === "published" ? "published" : "saved",
    message: status === "published" ? "Published to the live site." : "Draft saved.",
  };
}

export async function saveDraft(_prevState: WebsiteFormState, formData: FormData) {
  return writeConfig(formData, "draft");
}

export async function publishConfig(_prevState: WebsiteFormState, formData: FormData) {
  return writeConfig(formData, "published");
}
