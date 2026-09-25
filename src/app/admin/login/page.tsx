import { redirect } from "next/navigation";
import { getStaffProfile } from "@/lib/admin/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const profile = await getStaffProfile();
  if (profile) redirect("/admin");
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <div className="font-[var(--font-body)] text-small font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            ATF Platform
          </div>
          <h1 className="mt-2 text-[22px] font-bold">Admin sign in</h1>
        </div>

        {error === "unauthorized" && (
          <p role="alert" className="mb-4 text-center text-small text-[var(--color-danger)]">
            That magic link has expired or does not grant staff access. Only approved staff can sign in — ask an administrator for an invite, then request a new link.
          </p>
        )}

        {isSupabaseConfigured() ? (
          <LoginForm />
        ) : (
          <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] px-6 py-8 text-center">
            <p className="text-small text-[var(--color-ink-faint)]">
              No database is connected yet. Provision a Supabase project and set the env vars in
              <code className="mx-1 rounded bg-[var(--color-contrast-raised)] px-1.5 py-0.5">.env.local</code>
              to enable sign-in — see <code className="rounded bg-[var(--color-contrast-raised)] px-1.5 py-0.5">docs/architecture.md</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
