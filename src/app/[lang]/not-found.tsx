import Link from "next/link";

/**
 * Deliberately plain, not a locked-design page: the approved templates have no 404 content slot,
 * and CLAUDE.md requires flagging rather than inventing new visual design for the frozen files.
 * This reuses only the site's neutral black/white palette and system font stack, nothing else.
 */
export default function NotFound() {
  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "70vh", padding: "40px 20px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", color: "#050505" }}>
      <div style={{ maxWidth: 420 }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#929292", margin: "0 0 8px" }}>404</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>We couldn&apos;t find that page.</h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "#4f4f4f", margin: "0 0 24px" }}>
          The page may have moved or the link may be out of date.
        </p>
        <Link href="/" style={{ display: "inline-block", padding: "12px 24px", borderRadius: 999, background: "#050505", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
