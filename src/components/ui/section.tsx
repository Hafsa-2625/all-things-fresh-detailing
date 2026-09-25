import type { ReactNode } from "react";

export type SectionTone = "cinematic" | "contrast";

const TONE_CLASS: Record<SectionTone, string> = {
  cinematic: "bg-[var(--color-cinematic)] text-[var(--color-ink-inverse)]",
  contrast: "bg-[var(--color-contrast)] text-[var(--color-ink)]",
};

export function Section({
  tone,
  id,
  label,
  /** Vertical rhythm. "standard" for major sections, "tight" for supporting
   * ones, "none" when the section manages its own (full-bleed media). */
  rhythm = "standard",
  className = "",
  children,
}: {
  tone: SectionTone;
  id?: string;
  /** Internal QA label only — mirrors the approved mockup's data-screen-label. */
  label: string;
  rhythm?: "standard" | "tight" | "none";
  className?: string;
  children: ReactNode;
}) {
  const rhythmClass =
    rhythm === "standard" ? "section-rhythm" : rhythm === "tight" ? "section-rhythm-tight" : "";

  return (
    <section id={id} data-section={label} className={`${TONE_CLASS[tone]} ${rhythmClass} ${className}`}>
      {children}
    </section>
  );
}

export function Container({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-13 ${className}`}>{children}</div>;
}

/** Narrower measure for reading-length content — keeps body copy near the
 * ~65ch ideal instead of stretching across a 1680px container. */
export function ProseContainer({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-[900px] px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Eyebrow({
  children,
  tone = "default",
}: {
  children: ReactNode;
  /** "inverse" on cinematic surfaces, where faint ink would be invisible. */
  tone?: "default" | "inverse";
}) {
  return (
    <div
      className={`mb-5 font-[var(--font-display)] text-caption font-semibold uppercase tracking-[0.26em] ${
        tone === "inverse" ? "text-[var(--color-ink-inverse-faint)]" : "text-[var(--color-ink-faint)]"
      }`}
    >
      {children}
    </div>
  );
}

/** The one section-heading treatment used site-wide, so scale and tracking
 * stay consistent instead of each section inventing its own clamp(). */
export function SectionHeading({
  children,
  className = "",
  size = "standard",
}: {
  children: ReactNode;
  className?: string;
  size?: "standard" | "large";
}) {
  const scale =
    size === "large"
      ? "text-[clamp(32px,4.2vw,60px)]"
      : "text-[clamp(26px,3vw,44px)]";
  return (
    <h2
      className={`font-[var(--font-display)] ${scale} font-bold uppercase leading-[1.04] tracking-[-0.03em] text-balance ${className}`}
    >
      {children}
    </h2>
  );
}
