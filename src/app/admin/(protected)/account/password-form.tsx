"use client";

import { useActionState } from "react";
import { PasswordInput } from "@/components/admin/password-input";
import { setPassword, type PasswordActionState } from "./actions";

const initialState: PasswordActionState = { status: "idle" };

const inputClass =
  "h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 text-body outline-none focus-visible:border-[var(--color-focus)]";

export function PasswordForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(setPassword, initialState);

  return (
    <form action={formAction} className="flex max-w-[380px] flex-col gap-4">
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <label className="flex flex-col gap-1.5">
        <span className="text-small font-medium text-[var(--color-ink-muted)]">New password</span>
        <PasswordInput name="password" required minLength={10} maxLength={128} autoComplete="new-password" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-small font-medium text-[var(--color-ink-muted)]">Confirm new password</span>
        <PasswordInput name="confirm" required minLength={10} maxLength={128} autoComplete="new-password" className={inputClass} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-[var(--radius-control)] bg-[var(--color-ink)] text-body font-semibold text-[var(--color-canvas)] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save password"}
      </button>
      {state.status === "saved" && <p role="status" className="text-small text-[var(--color-success)]">{state.message}</p>}
      {state.status === "error" && <p role="alert" className="text-small text-[var(--color-danger)]">{state.message}</p>}
    </form>
  );
}
