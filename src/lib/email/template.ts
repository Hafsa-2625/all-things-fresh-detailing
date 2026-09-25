import "server-only";

/**
 * One input shape renders both the HTML and plain-text bodies, so the two can never drift apart.
 *
 * Everything interpolated here is escaped. Lead fields are typed by anonymous visitors on the
 * public form, so treating them as trusted markup would let a stranger inject arbitrary HTML
 * into staff inboxes.
 */

export interface EmailRow {
  label: string;
  value: string;
}

export interface EmailContent {
  /** Inbox preview line. Falls back to the intro. */
  preheader?: string;
  /** Small uppercase label above the heading. */
  eyebrow?: string;
  heading: string;
  intro?: string;
  rows?: EmailRow[];
  paragraphs?: string[];
  cta?: { label: string; url: string };
  footerNote?: string;
}

const BRAND = "All Things Fresh";
const INK = "#050505";
const MUTED = "#747474";
const FAINT = "#929292";
const BORDER = "#e7e5e1";
const CANVAS = "#f4f4f5";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** Only http(s) links may become a button; anything else is dropped rather than rendered. */
function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function rowsHtml(rows: EmailRow[]): string {
  const cells = rows
    .map(
      (row) => `
            <tr>
              <td style="padding:8px 0;font-size:12px;line-height:18px;color:${FAINT};width:150px;vertical-align:top;">${escapeHtml(row.label)}</td>
              <td style="padding:8px 0;font-size:14px;line-height:20px;color:${INK};vertical-align:top;">${escapeHtml(row.value)}</td>
            </tr>`,
    )
    .join("");
  return `
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${BORDER};border-bottom:1px solid ${BORDER};margin:24px 0;">
            ${cells}
          </table>`;
}

function ctaHtml(cta: { label: string; url: string }): string {
  const href = safeUrl(cta.url);
  if (!href) return "";
  return `
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;">
            <tr>
              <td style="background:${INK};border-radius:999px;">
                <a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#ffffff;text-decoration:none;">${escapeHtml(cta.label)}</a>
              </td>
            </tr>
          </table>`;
}

export function renderEmailHtml(content: EmailContent): string {
  const preheader = content.preheader || content.intro || "";
  const paragraphs = (content.paragraphs ?? [])
    .map((text) => `<p style="margin:0 0 14px;font-size:14px;line-height:22px;color:${MUTED};">${escapeHtml(text)}</p>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(content.heading)}</title></head>
<body style="margin:0;padding:0;background:${CANVAS};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CANVAS};padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BORDER};border-radius:14px;">
          <tr>
            <td style="padding:28px 32px 0;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:15px;font-weight:bold;letter-spacing:-0.02em;color:${INK};">${BRAND}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 32px;font-family:Arial,Helvetica,sans-serif;">
              ${content.eyebrow ? `<div style="font-size:10px;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;color:${FAINT};margin-bottom:8px;">${escapeHtml(content.eyebrow)}</div>` : ""}
              <h1 style="margin:0 0 12px;font-size:22px;line-height:28px;font-weight:bold;letter-spacing:-0.03em;color:${INK};">${escapeHtml(content.heading)}</h1>
              ${content.intro ? `<p style="margin:0 0 14px;font-size:14px;line-height:22px;color:${MUTED};">${escapeHtml(content.intro)}</p>` : ""}
              ${paragraphs}
              ${content.rows?.length ? rowsHtml(content.rows) : ""}
              ${content.cta ? ctaHtml(content.cta) : ""}
            </td>
          </tr>
          ${content.footerNote ? `<tr><td style="padding:0 32px 26px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${FAINT};">${escapeHtml(content.footerNote)}</td></tr>` : ""}
        </table>
        <div style="max-width:600px;margin:14px auto 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;color:${FAINT};text-align:center;">
          Sent automatically by the ${BRAND} website.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plain-text twin of the same content, kept as the multipart fallback. */
export function renderEmailText(content: EmailContent): string {
  const lines: string[] = [content.heading, ""];
  if (content.intro) lines.push(content.intro, "");
  for (const paragraph of content.paragraphs ?? []) lines.push(paragraph, "");
  for (const row of content.rows ?? []) lines.push(`${row.label}: ${row.value}`);
  if (content.rows?.length) lines.push("");
  if (content.cta) {
    const href = safeUrl(content.cta.url);
    if (href) lines.push(`${content.cta.label}: ${href}`, "");
  }
  if (content.footerNote) lines.push(content.footerNote);
  return lines.join("\n").trimEnd();
}
