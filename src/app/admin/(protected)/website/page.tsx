import { requireStaff, canWrite } from "@/lib/admin/session";
import { getLatestConfigForEditing } from "@/tenant/admin-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listRecords } from "@/lib/operations/store";
import { MediaLibrary } from "@/components/admin/media-library";
import { WebsiteForm } from "./website-form";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "all-things-fresh";

export default async function WebsiteSettingsPage() {
  const profile = await requireStaff();
  const { row, config } = await getLatestConfigForEditing(TENANT_ID);

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-[22px] font-bold">Website</h1>
          <p className="mt-1 text-body text-[var(--color-ink-muted)]">
            Update business, booking, and social information. The public design and layout remain locked.
          </p>
        </div>
        {row && (
          <span className="text-caption text-[var(--color-ink-faint)]">
            {row.status === "draft" ? "Editing draft" : "Editing published"} · v{row.version}
          </span>
        )}
      </div>

      {!isSupabaseConfigured() ? (
        <div className="max-w-[640px] rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] px-6 py-8 text-center">
          <p className="text-small text-[var(--color-ink-faint)]">
            No database connected. This page is showing the versioned fallback config
            (<code className="mx-1 rounded bg-[var(--color-contrast-raised)] px-1.5 py-0.5">src/tenant/tenants/all-things-fresh.ts</code>)
            read-only — connect Supabase and run both migrations to make it editable here.
          </p>
        </div>
      ) : (
        <>
          <WebsiteForm config={config} canEdit={canWrite(profile.role)} />
          {/* Photos for the homepage slots (service cards, before/after) — content only, the boxes are fixed. */}
          <div className="mt-8 max-w-[1280px]">
            <MediaLibrary initialRows={await listRecords("media_assets")} canEdit={canWrite(profile.role)} />
          </div>
        </>
      )}
    </div>
  );
}
