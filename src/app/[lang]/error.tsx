"use client";

import { useEffect } from "react";

/** Same deliberately-plain treatment as not-found.tsx — see that file's comment. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[public]", error);
  }, [error]);

  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "70vh", padding: "40px 20px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", color: "#050505" }}>
      <div style={{ maxWidth: 420 }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#929292", margin: "0 0 8px" }}>Something went wrong</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>This page hit a problem.</h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "#4f4f4f", margin: "0 0 24px" }}>
          Please try again, or call us if it keeps happening.
        </p>
        <button type="button" onClick={() => reset()} style={{ display: "inline-block", padding: "12px 24px", borderRadius: 999, background: "#050505", color: "#fff", fontSize: 13, fontWeight: 700, border: 0, cursor: "pointer" }}>
          Try again
        </button>
      </div>
    </main>
  );
}
