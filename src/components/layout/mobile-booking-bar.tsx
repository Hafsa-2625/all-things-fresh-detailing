import type { TenantConfig } from "@/tenant/schema";
import type { Dictionary } from "@/i18n/dictionary";
import { BookNowButton } from "@/components/booking/book-now-button";
import { TrackedTelLink } from "@/components/analytics/tracked-tel-link";

/**
 * Persistent mobile Book Now (Section 19 of the brief): a slim, integrated
 * bar — not a giant fixed footer — that keeps the primary conversion action
 * reachable on phones without covering content. Hidden on desktop, where
 * the header CTA already provides constant access.
 */
export function MobileBookingBar({ tenant, dict }: { tenant: TenantConfig; dict: Dictionary }) {
  const telHref = `tel:${tenant.business.phone.replace(/[^0-9+]/g, "")}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-[var(--color-border)] bg-[var(--color-canvas)]/95 px-3 py-2.5 backdrop-blur-md sm:hidden">
      <TrackedTelLink
        href={telHref}
        ariaLabel={dict.footer.callUs}
        className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-control)] border border-[var(--color-border)] text-[var(--color-ink)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.7 2z" />
        </svg>
      </TrackedTelLink>
      <BookNowButton tenant={tenant} label={dict.nav.bookNow} variant="primary-on-light" className="h-12 flex-1" />
    </div>
  );
}
