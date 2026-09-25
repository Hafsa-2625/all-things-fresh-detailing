"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/tenant/schema";
import { ALL_LOCALES, LOCALE_LABELS } from "@/i18n/locales";
import { track } from "@/lib/analytics/track";

function persistLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
}

export function LanguageSwitcher({
  current,
  enabled,
  label,
}: {
  current: Locale;
  enabled: Locale[];
  label: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (enabled.length < 2) return null;

  function switchTo(locale: Locale) {
    persistLocaleCookie(locale);
    track("language_switch", { from: current, to: locale });
    const segments = pathname.split("/");
    segments[1] = locale;
    router.push(segments.join("/") || "/");
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex items-center font-[var(--font-display)] text-caption font-semibold tracking-[0.08em]"
    >
      {ALL_LOCALES.filter((l) => enabled.includes(l)).map((locale, i, arr) => (
        <span key={locale} className="inline-flex items-center">
          <button
            type="button"
            role="radio"
            aria-checked={current === locale}
            onClick={() => switchTo(locale)}
            // min-h-11 keeps the hit area at the 44px minimum without
            // visually enlarging the label (measured at 16x17 before).
            className={`inline-flex min-h-11 items-center px-1.5 transition-colors ${
              current === locale
                ? "text-[var(--color-ink-inverse)]"
                : "text-[var(--color-ink-inverse-faint)] hover:text-[var(--color-ink-inverse)]"
            }`}
          >
            {locale.toUpperCase()}
          </button>
          {i < arr.length - 1 && (
            <span aria-hidden="true" className="text-[var(--color-ink-inverse-faint)]">
              /
            </span>
          )}
        </span>
      ))}
      <span className="sr-only">{LOCALE_LABELS[current]}</span>
    </div>
  );
}
