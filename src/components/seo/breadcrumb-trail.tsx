import Link from "next/link";

export function BreadcrumbTrail({ crumbs }: { crumbs: { label: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-[var(--color-border)]">
      <ol className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center gap-2 px-5 py-4 text-caption text-[var(--color-ink-faint)] sm:px-8 lg:px-13">
        {crumbs.map((c, i) => (
          <li key={c.path} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === crumbs.length - 1 ? (
              <span className="text-[var(--color-ink)]" aria-current="page">{c.label}</span>
            ) : (
              <Link href={c.path} className="hover:text-[var(--color-ink)]">{c.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
