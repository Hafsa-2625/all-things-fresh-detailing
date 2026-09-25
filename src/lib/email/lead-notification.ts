import "server-only";
import { isEmailConfigured, sendEmail } from "./send";
import { recipientsForEvent } from "./notification-recipients";
import { renderEmailHtml, renderEmailText, type EmailRow } from "./template";

export const LEAD_CREATED_EVENT = "lead.created";

type LeadSummary = {
  id: string; name: string; phone: string; email?: string; service?: string; vehicleType?: string; vehicle?: string;
  preferredDate?: string; street?: string; unit?: string; city?: string; state?: string; postalCode?: string; notes?: string; source?: string;
};

export async function emailNewLead(lead: LeadSummary): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  const to = await recipientsForEvent(LEAD_CREATED_EVENT, process.env.LEAD_NOTIFICATION_EMAIL);
  if (to.length === 0) return false;

  const address = [lead.street, lead.unit, lead.city, lead.state, lead.postalCode].filter(Boolean).join(", ");
  const vehicle = [lead.vehicleType, lead.vehicle].filter(Boolean).join(" — ");
  const rows: EmailRow[] = [
    { label: "Name", value: lead.name },
    { label: "Phone", value: lead.phone },
    ...(lead.email ? [{ label: "Email", value: lead.email }] : []),
    ...(lead.service ? [{ label: "Service", value: lead.service }] : []),
    ...(vehicle ? [{ label: "Vehicle", value: vehicle }] : []),
    ...(lead.preferredDate ? [{ label: "Preferred date", value: lead.preferredDate }] : []),
    ...(address ? [{ label: "Address", value: address }] : []),
    ...(lead.notes ? [{ label: "Notes", value: lead.notes }] : []),
    { label: "Source", value: lead.source || "website" },
  ];

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const content = {
    eyebrow: "New request",
    heading: `${lead.name} asked for a detail`,
    intro: "A new request just came in through the website.",
    rows,
    ...(siteUrl ? { cta: { label: "Open in the admin", url: `${siteUrl}/admin/leads` } } : {}),
    footerNote: "Reply to this email to answer the customer directly.",
  };

  const subject = `New lead: ${lead.name}${lead.service ? ` — ${lead.service}` : ""}`.replace(/[\r\n]+/g, " ").slice(0, 150);
  return sendEmail({
    to,
    subject,
    text: renderEmailText(content),
    html: renderEmailHtml(content),
    replyTo: lead.email || undefined,
  });
}
