import "server-only";

export type EmailMessage = { to: string[]; subject: string; text: string; html?: string; replyTo?: string };

/** Whether transactional email is configured (EMAIL_PROVIDER=resend with a key and sender). */
export function isEmailConfigured(): boolean {
  return process.env.EMAIL_PROVIDER === "resend" && Boolean(process.env.EMAIL_PROVIDER_KEY && process.env.EMAIL_FROM);
}

/**
 * Sends through the Resend HTTP API. Returns false when email is not configured, throws when
 * Resend rejects the message. While EMAIL_FROM is onboarding@resend.dev, Resend only delivers to
 * the Resend account owner's address; verify a domain and use a sender on it for real recipients.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  if (!isEmailConfigured() || message.to.length === 0) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.EMAIL_PROVIDER_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend rejected the email (${response.status}): ${detail.slice(0, 300)}`);
  }
  return true;
}
