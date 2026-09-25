import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { template: "%s | Admin", default: "Admin" },
  robots: { index: false, follow: false },
};

/**
 * Its own root layout (no app/layout.tsx exists above /admin or /[lang]) —
 * Next.js explicitly supports multiple root layouts this way. The admin
 * panel is intentionally a separate, non-localized app: it reuses the same
 * design tokens from globals.css for visual consistency, but doesn't need
 * Archivo/dark-cinematic hero styling or the [lang] segment.
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-full bg-[var(--color-contrast)] text-[var(--color-ink)] antialiased">
        {children}
      </body>
    </html>
  );
}
