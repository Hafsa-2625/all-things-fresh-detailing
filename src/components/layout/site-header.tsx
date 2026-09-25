"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { TenantConfig } from "@/tenant/schema";
import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/tenant/schema";
import { BookNowButton } from "@/components/booking/book-now-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/language/language-switcher";
import { staticPath } from "@/i18n/routes";

export function SiteHeader({
  tenant,
  dict,
  locale,
}: {
  tenant: TenantConfig;
  dict: Dictionary;
  locale: Locale;
}) {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Real pages where they exist (Services/Our Work/About are now indexable
  // routes, not just homepage anchors) so this nav works from any page, not
  // only the homepage it used to assume it was rendered on.
  const navLinks = [
    { href: `/${locale}/services`, label: dict.nav.services },
    { href: `/${locale}/projects`, label: dict.nav.ourWork },
    { href: `/${locale}#reviews`, label: dict.nav.reviews },
    { href: staticPath("about", locale), label: dict.nav.craftsmanship },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        solid
          ? "border-b border-[var(--color-border-inverse)] bg-[var(--color-cinematic)]/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[76px] w-full max-w-[1680px] items-center justify-between gap-8 px-5 sm:px-8 lg:px-13">
        <Link href={`/${locale}`} className="flex items-center gap-3 text-[var(--color-ink-inverse)]">
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-[var(--color-ink-inverse)]">
            <Image src={tenant.brand.logo} alt={tenant.brand.name} width={28} height={28} className="h-7 w-7 object-contain" />
          </span>
          <span className="leading-none">
            <span className="block font-[var(--font-display)] text-small font-bold tracking-[0.04em]">
              {tenant.brand.name.toUpperCase()}
            </span>
            <span className="mt-1 block text-[9px] tracking-[0.4em] text-[var(--color-ink-inverse-faint)]">
              DETAILING
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 font-[var(--font-display)] text-caption font-semibold tracking-[0.16em] text-[var(--color-ink-inverse-muted)] lg:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-[var(--color-ink-inverse)]">
              {l.label.toUpperCase()}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 text-[var(--color-ink-inverse)] md:flex">
            <LanguageSwitcher current={locale} enabled={tenant.languages.enabled} label={dict.language.label} />
            {tenant.theme.allowSwitch && <ThemeToggle labels={dict.theme} />}
          </div>
          <div className="hidden sm:block">
            <BookNowButton tenant={tenant} label={dict.nav.bookNow} variant="primary-on-dark" className="h-11 px-6" />
          </div>
          <button
            type="button"
            aria-label={menuOpen ? dict.nav.closeMenu : dict.nav.openMenu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-full border border-[var(--color-border-inverse)] text-[var(--color-ink-inverse)] lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-[var(--color-border-inverse)] bg-[var(--color-cinematic)] px-5 py-6 text-[var(--color-ink-inverse)] lg:hidden">
          <nav className="flex flex-col gap-5 font-[var(--font-display)] text-sm font-semibold tracking-[0.1em]">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
                {l.label.toUpperCase()}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex items-center gap-5">
            <LanguageSwitcher current={locale} enabled={tenant.languages.enabled} label={dict.language.label} />
            {tenant.theme.allowSwitch && <ThemeToggle labels={dict.theme} />}
          </div>
        </div>
      )}
    </header>
  );
}
