"use client";

import { useEffect } from "react";

/**
 * Renders only when the root layout itself fails, so it must provide its own <html>/<body> —
 * the layout that would normally do that may be the thing that broke. No dependency on
 * public.css or any other layout, and no attempt to reproduce the locked design here.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, display: "grid", placeItems: "center", minHeight: "100vh", padding: "40px 20px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", color: "#050505", background: "#fff" }}>
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>Something went wrong.</h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#4f4f4f", margin: "0 0 24px" }}>Please try again.</p>
          <button type="button" onClick={() => reset()} style={{ display: "inline-block", padding: "12px 24px", borderRadius: 999, background: "#050505", color: "#fff", fontSize: 13, fontWeight: 700, border: 0, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
