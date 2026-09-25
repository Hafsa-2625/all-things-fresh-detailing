import type { Locale } from "@/tenant/schema";

export const ALL_LOCALES: Locale[] = ["en", "es"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

export function isLocale(value: string): value is Locale {
  return (ALL_LOCALES as string[]).includes(value);
}
