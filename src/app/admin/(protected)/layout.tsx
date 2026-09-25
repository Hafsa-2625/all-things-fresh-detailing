import type { ReactNode } from "react";
import { AccountLink, AdminNav } from "@/components/admin/admin-nav";
import { requireStaff } from "@/lib/admin/session";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireStaff();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-6">
        <div className="mb-8 px-2">
          <div className="text-caption font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">All Things Fresh</div>
          <div className="mt-1 text-[10px] text-[var(--color-ink-faint)]">Operations console</div>
        </div>
        <AdminNav />
        <div className="mt-auto border-t border-[var(--color-border)] pt-4">
          <div className="px-2 text-small">
            <div className="truncate font-medium">{profile.email}</div>
            <div className="mt-0.5 text-caption uppercase tracking-[0.08em] text-[var(--color-ink-faint)]">
              {profile.role.replace("_", " ")}
            </div>
          </div>
          <AccountLink />
          <form action="/admin/logout" method="POST" className="mt-3 px-2">
            <button type="submit" className="text-small text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
