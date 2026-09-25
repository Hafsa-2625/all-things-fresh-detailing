import Image from "next/image";

export interface MediaRef {
  src: string;
  alt: string;
  focalPoint: string;
}

/**
 * Renders real media when the CMS/tenant config has it, or a deliberate,
 * on-brand empty state when it doesn't — never a broken image, never a
 * placeholder that reads as an error, and never a synthetic/AI stand-in
 * photo (Section 6 of the brief: no fake vehicles in production).
 */
export function AdaptiveMedia({
  media,
  placeholderLabel,
  priority = false,
  sizes = "100vw",
  className = "",
}: {
  media?: MediaRef;
  placeholderLabel: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  if (media) {
    return (
      <Image
        src={media.src}
        alt={media.alt}
        fill
        priority={priority}
        sizes={sizes}
        style={{ objectFit: "cover", objectPosition: media.focalPoint }}
        className={className}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={placeholderLabel}
      className={`absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[repeating-linear-gradient(135deg,var(--color-border)_0,var(--color-border)_1px,transparent_1px,transparent_14px)] ${className}`}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-[var(--color-ink-faint)]" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="M21 16l-5-5-5 5-3-3-3 3" />
      </svg>
      <span className="max-w-[22ch] text-center text-caption font-medium tracking-wide text-[var(--color-ink-faint)]">
        {placeholderLabel}
      </span>
    </div>
  );
}
