"use client";

import { useActionState } from "react";
import type { TenantConfig } from "@/tenant/schema";
import { saveDraft, publishConfig, type WebsiteFormState } from "./actions";

const initialState: WebsiteFormState = { status: "idle" };

function Field({ label, name, defaultValue, type = "text" }: { label: string; name: string; defaultValue: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-small font-medium text-[var(--color-ink-muted)]">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="h-10 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 text-small outline-none focus-visible:border-[var(--color-focus)]"
      />
    </label>
  );
}

export function WebsiteForm({ config, canEdit }: { config: TenantConfig; canEdit: boolean }) {
  const [saveState, saveAction, savePending] = useActionState(saveDraft, initialState);
  const [publishState, publishActionFn, publishPending] = useActionState(publishConfig, initialState);
  const latest = publishState.status !== "idle" ? publishState : saveState;

  return (
    <form className="flex max-w-[640px] flex-col gap-8">
      <fieldset disabled={!canEdit} className="flex flex-col gap-8 disabled:opacity-60">
        <section>
          <h2 className="mb-3 text-small font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-faint)]">
            Business information
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" name="phone" defaultValue={config.business.phone} />
            <Field label="Email" name="email" defaultValue={config.business.email ?? ""} type="email" />
            <Field label="Hours" name="hours" defaultValue={config.business.hours} />
            <Field label="Service area" name="serviceArea" defaultValue={config.business.serviceArea} />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-small font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-faint)]">
            Booking
          </h2>
          <Field label="Public booking URL" name="bookingUrl" defaultValue={config.booking.publicUrl ?? ""} />
        </section>

        <section>
          <h2 className="mb-3 text-small font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-faint)]">
            Social
          </h2>
          <div className="flex flex-col gap-4">
            {(["instagram", "tiktok", "youtube"] as const).map((platform) => (
              <div key={platform} className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-3.5">
                <label className="flex items-center justify-between rounded-[var(--radius-control)] border border-[var(--color-border)] px-3.5 py-2.5"><span className="text-small">{platform === "instagram" ? "Instagram" : platform === "tiktok" ? "TikTok" : "YouTube"}</span><input type="checkbox" name={`${platform}_enabled`} defaultChecked={config.social[platform].enabled} className="h-4 w-4 accent-[var(--color-ink)]" /></label>
                <div className="mt-2.5">
                  <Field label="Profile URL" name={`${platform}_url`} defaultValue={config.social[platform].url ?? ""} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-3 border-t border-[var(--color-border)] pt-6">
          <button
            type="submit"
            formAction={saveAction}
            disabled={savePending || publishPending}
            className="h-10 rounded-[var(--radius-control)] border border-[var(--color-border)] px-5 text-small font-semibold hover:bg-[var(--color-contrast-raised)] disabled:opacity-50"
          >
            {savePending ? "Saving…" : "Save draft"}
          </button>
          <button
            type="submit"
            formAction={publishActionFn}
            disabled={savePending || publishPending}
            className="h-10 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-5 text-small font-semibold text-[var(--color-canvas)] hover:opacity-90 disabled:opacity-50"
          >
            {publishPending ? "Publishing…" : "Publish"}
          </button>
          {latest.status !== "idle" && (
            <span className={`text-small ${latest.status === "error" ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}>
              {latest.message}
            </span>
          )}
        </div>
      </fieldset>
      {!canEdit && (
        <p className="text-small text-[var(--color-ink-faint)]">
          Your role can view these settings but not change them.
        </p>
      )}
    </form>
  );
}
