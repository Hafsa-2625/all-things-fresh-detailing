"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/analytics/track";

export function TrackedTelLink({ href, className, ariaLabel, children }: { href: string; className?: string; ariaLabel?: string; children: ReactNode }) {
  return (
    <a href={href} aria-label={ariaLabel} className={className} onClick={() => track("phone_click")}>
      {children}
    </a>
  );
}
