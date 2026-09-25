import type { ReactNode } from "react";

/**
 * The site's four button treatments. Centralised so hover/active/focus and
 * sizing stay identical everywhere — the design QA pass found CTAs with
 * three different heights and two different radii across sections.
 *
 * `-on-dark` variants are for cinematic surfaces (which stay near-black in
 * both themes), `-on-light` for contrast surfaces.
 */
export type ButtonVariant =
  | "primary-on-dark"
  | "primary-on-light"
  | "secondary-on-dark"
  | "secondary-on-light"
  | "text-on-dark"
  | "text-on-light";

export type ButtonSize = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-3 whitespace-nowrap font-[var(--font-display)] font-semibold uppercase tracking-[0.14em] transition-[background-color,color,border-color,opacity,gap] duration-200 disabled:cursor-not-allowed disabled:opacity-40";

const SIZE: Record<ButtonSize, string> = {
  // 48px/56px — both clear the 44px minimum touch target.
  md: "h-12 px-7 text-caption rounded-[var(--radius-control)]",
  lg: "h-14 px-9 text-small rounded-[var(--radius-control)]",
};

const VARIANT: Record<ButtonVariant, string> = {
  // Light fill on a dark surface — the primary CTA in cinematic sections.
  "primary-on-dark":
    "bg-[var(--color-ink-inverse)] text-[var(--color-cinematic)] hover:bg-white active:bg-[var(--color-ink-inverse)]/90",
  // Dark fill on a light surface.
  "primary-on-light":
    "bg-[var(--color-ink)] text-[var(--color-canvas)] hover:opacity-88 active:opacity-95",
  "secondary-on-dark":
    "border border-[var(--color-border-inverse)] text-[var(--color-ink-inverse)] hover:border-[var(--color-ink-inverse)] hover:bg-white/[0.06]",
  "secondary-on-light":
    "border border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-contrast-raised)]",
  // Text links with a travelling arrow — used for tertiary actions.
  "text-on-dark": "text-[var(--color-ink-inverse)] hover:gap-5 px-0",
  "text-on-light": "text-[var(--color-ink)] hover:gap-5 px-0",
};

export function buttonClass(variant: ButtonVariant, size: ButtonSize = "md", className = "") {
  const isText = variant.startsWith("text-");
  return `${BASE} ${isText ? "h-12 text-caption" : SIZE[size]} ${VARIANT[variant]} ${className}`;
}

export function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="10"
      viewBox="0 0 24 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      className={className}
    >
      <path d="M0 7h22M16 1l6 6-6 6" />
    </svg>
  );
}

/** Anchor styled as a button. For real buttons use `buttonClass` directly. */
export function ButtonLink({
  href,
  variant,
  size = "md",
  className = "",
  withArrow = true,
  children,
}: {
  href: string;
  variant: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  withArrow?: boolean;
  children: ReactNode;
}) {
  return (
    <a href={href} className={buttonClass(variant, size, className)}>
      {children}
      {withArrow && <ArrowRight />}
    </a>
  );
}
