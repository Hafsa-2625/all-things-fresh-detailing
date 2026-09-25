"use client";

import { useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionary";
import { Section, Container, Eyebrow, SectionHeading } from "@/components/ui/section";
import { AdaptiveMedia, type MediaRef } from "@/components/media/adaptive-media";

export interface BeforeAfterPair {
  before?: MediaRef;
  after?: MediaRef;
}

export function BeforeAfter({ dict, pairs = [{}] }: { dict: Dictionary; pairs?: BeforeAfterPair[] }) {
  const [split, setSplit] = useState(50);
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pair = pairs[index] ?? {};

  function updateFromClientX(clientX: number) {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplit(Math.min(100, Math.max(0, pct)));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") setSplit((s) => Math.max(0, s - 5));
    if (e.key === "ArrowRight") setSplit((s) => Math.min(100, s + 5));
    if (e.key === "Home") setSplit(0);
    if (e.key === "End") setSplit(100);
  }

  return (
    <Section tone="contrast" id="transformations" label="04 Transformations" rhythm="none" className="pt-[clamp(64px,7vw,112px)]">
      <Container className="mb-[clamp(30px,4vw,54px)] flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>{dict.beforeAfter.eyebrow}</Eyebrow>
          <SectionHeading size="large">{dict.beforeAfter.heading}</SectionHeading>
        </div>
        <p className="max-w-[38ch] text-small leading-[1.65] text-[var(--color-ink-muted)]">{dict.beforeAfter.instructions}</p>
      </Container>

      <div
        ref={trackRef}
        role="slider"
        aria-label={dict.beforeAfter.heading}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(split)}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as Element).setPointerCapture(e.pointerId);
          updateFromClientX(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && updateFromClientX(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        className="relative aspect-[16/10] max-h-[76vh] min-h-[360px] w-full touch-none select-none overflow-hidden bg-[var(--color-cinematic)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] sm:aspect-[21/9]"
        style={{ cursor: "ew-resize" }}
      >
        <div className="absolute inset-0">
          <AdaptiveMedia media={pair.after} placeholderLabel="After photo — add via Media Library" />
        </div>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
          <AdaptiveMedia media={pair.before} placeholderLabel="Before photo — add via Media Library" />
        </div>
        <div className="pointer-events-none absolute top-[clamp(16px,2.5vw,36px)] left-[clamp(16px,2.5vw,36px)] font-[var(--font-display)] text-caption font-semibold uppercase tracking-[0.22em] text-white/75 [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]">
          {dict.beforeAfter.before.toUpperCase()}
        </div>
        <div className="pointer-events-none absolute top-[clamp(16px,2.5vw,36px)] right-[clamp(16px,2.5vw,36px)] font-[var(--font-display)] text-caption font-semibold uppercase tracking-[0.22em] text-white/75 [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]">
          {dict.beforeAfter.after.toUpperCase()}
        </div>
        {/* Divider + grip. The bare 1px line gave no affordance that the
            frame was draggable; the grip reads as a control without turning
            into a heavy UI widget. */}
        <div className="pointer-events-none absolute top-0 bottom-0 w-px bg-white/90" style={{ left: `${split}%` }}>
          <span className="absolute top-1/2 left-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-black/25 backdrop-blur-sm">
            <svg width="16" height="12" viewBox="0 0 20 14" fill="none" stroke="white" strokeWidth="1.6" aria-hidden="true">
              <path d="M7.5 2.5 3 7l4.5 4.5M12.5 2.5 17 7l-4.5 4.5" />
            </svg>
          </span>
        </div>
        {pairs.length > 1 && (
          <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-1 rounded-full bg-white p-1 shadow-lg">
            <button
              type="button"
              aria-label="Previous transformation"
              onClick={() => setIndex((i) => (i - 1 + pairs.length) % pairs.length)}
              className="grid h-11 w-11 place-items-center rounded-full text-[#0a0a0a] hover:bg-black/5"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button
              type="button"
              aria-label="Next transformation"
              onClick={() => setIndex((i) => (i + 1) % pairs.length)}
              className="grid h-11 w-11 place-items-center rounded-full text-[#0a0a0a] hover:bg-black/5"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>
    </Section>
  );
}
