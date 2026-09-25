/** Shown instantly while an admin screen loads its data, so navigation never feels frozen. */
export default function AdminLoading() {
  return (
    <div className="max-w-[1180px] animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-3 w-24 rounded bg-[var(--color-contrast-raised)]" />
      <div className="mt-3 h-7 w-64 rounded bg-[var(--color-contrast-raised)]" />
      <div className="mt-8 h-[320px] rounded-[14px] bg-[var(--color-contrast-raised)]" />
    </div>
  );
}
