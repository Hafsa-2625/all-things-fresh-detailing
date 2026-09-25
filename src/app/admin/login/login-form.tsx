"use client";

import { useActionState } from "react";
import { signIn, type LoginActionState } from "./actions";

const initialState: LoginActionState = { status: "idle" };

const inputClass =
  "h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 text-body outline-none focus-visible:border-[var(--color-focus)]";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-small font-medium text-[var(--color-ink-muted)]">Work email</span>
        <input type="email" name="email" required autoFocus autoComplete="username" placeholder="you@yourcompany.com" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-small font-medium text-[var(--color-ink-muted)]">Password</span>
        <input type="password" name="password" autoComplete="current-password" maxLength={128} className={inputClass} />
      </label>

      <button
        type="submit"
        name="intent"
        value="password"
        disabled={pending}
        className="h-11 rounded-[var(--radius-control)] bg-[var(--color-ink)] text-body font-semibold text-[var(--color-canvas)] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <button
        type="submit"
        name="intent"
        value="link"
        disabled={pending}
        className="h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] text-body font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)] disabled:opacity-50"
      >
        Email me a magic link instead
      </button>

      {state.status === "sent" && (
        <p role="status" className="text-small text-[var(--color-success)]">{state.message}</p>
      )}
      {state.status === "error" && (
        <p role="alert" className="text-small text-[var(--color-danger)]">{state.message}</p>
      )}
    </form>
  );
}
