"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Today" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/jobs", label: "Jobs & schedule" },
  { href: "/admin/schedule", label: "Crew calendar" },
  { href: "/admin/customers", label: "Customers & vehicles" },
  { href: "/admin/staff", label: "Staff & permissions" },
  { href: "/admin/website", label: "Settings" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-[var(--radius-control)] px-3 py-2 text-body font-medium transition-colors hover:bg-[var(--color-contrast-raised)] hover:text-[var(--color-ink)] ${
              active ? "bg-[var(--color-contrast-raised)] font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AccountLink() {
  const active = isActive(usePathname(), "/admin/account");
  return (
    <Link
      href="/admin/account"
      aria-current={active ? "page" : undefined}
      className={`mt-3 block px-2 text-small hover:text-[var(--color-ink)] ${active ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-faint)]"}`}
    >
      My account
    </Link>
  );
}
