"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme/script";
import type { Dictionary } from "@/i18n/dictionary";
import { track } from "@/lib/analytics/track";

type ThemeChoice = "light" | "dark" | "system";
const CHANGE_EVENT = "atf:theme-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot(): ThemeChoice {
  return (window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeChoice | null) ?? "system";
}

function getServerSnapshot(): ThemeChoice {
  return "system";
}

function apply(next: ThemeChoice) {
  window.localStorage.setItem(THEME_STORAGE_KEY, next);
  if (next === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", next);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  track("theme_switch", { to: next });
}

export function ThemeToggle({ labels }: { labels: Dictionary["theme"] }) {
  const choice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const options: { key: ThemeChoice; label: string }[] = [
    { key: "light", label: labels.light },
    { key: "dark", label: labels.dark },
    { key: "system", label: labels.system },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={labels.toggleLabel}
      // Sits on cinematic surfaces (header), so it uses the fixed inverse
      // tokens rather than theme-flipping ink. min-h-9 on a 44px-tall wrapper
      // keeps the control visually compact while the row stays touch-sized.
      className="inline-flex min-h-11 items-center gap-0.5 rounded-[var(--radius-pill)] border border-[var(--color-border-inverse)] p-0.5"
    >
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          role="radio"
          aria-checked={choice === opt.key}
          onClick={() => apply(opt.key)}
          className={`inline-flex min-h-9 items-center rounded-[var(--radius-pill)] px-3 font-[var(--font-display)] text-caption font-semibold tracking-[0.06em] transition-colors ${
            choice === opt.key
              ? "bg-[var(--color-ink-inverse)] text-[var(--color-cinematic)]"
              : "text-[var(--color-ink-inverse-faint)] hover:text-[var(--color-ink-inverse)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
