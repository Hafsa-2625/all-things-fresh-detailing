import "server-only";
import { isEmailConfigured, sendEmail } from "./send";
import { renderEmailHtml, renderEmailText } from "./template";
import { getTenant } from "@/tenant/get-tenant";

type LeadSummary = { name: string; email?: string; service?: string; preferredDate?: string };

/** Sent to the visitor themselves, not staff. Silently skipped when they gave no email. */
export async function emailLeadConfirmation(lead: LeadSummary): Promise<boolean> {
  if (!isEmailConfigured() || !lead.email) return false;

  const phone = (await getTenant()).business.phone;
  const content = {
    preheader: "We received your request and will reply within 24 hours.",
    eyebrow: "Request received",
    heading: `Thanks, ${lead.name || "there"}`,
    intro: `We got your request${lead.service ? ` for ${lead.service}` : ""} and will get back to you within 24 hours to confirm the details.`,
    rows: [
      ...(lead.service ? [{ label: "Service", value: lead.service }] : []),
      ...(lead.preferredDate ? [{ label: "Preferred date", value: lead.preferredDate }] : []),
    ],
    paragraphs: [`If anything is urgent or you need to change something, call us on ${phone}.`],
    footerNote: "You're receiving this because you submitted a request on our website. No account was created.",
  };

  return sendEmail({
    to: [lead.email],
    subject: "We received your request",
    text: renderEmailText(content),
    html: renderEmailHtml(content),
  });
}
