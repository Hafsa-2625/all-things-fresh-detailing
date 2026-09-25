import { NextResponse } from "next/server";
import { z } from "zod";
import { canWrite, getStaffProfile } from "@/lib/admin/session";
import { findRecord, insertRecord, updateRecord } from "@/lib/operations/store";

const bodySchema = z.object({ leadId: z.string().uuid() });

/** Creates a customer (and a vehicle, when the lead named one) from a lead, and links the lead to it. */
export async function POST(request: Request) {
  const profile = await getStaffProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canWrite(profile.role)) return NextResponse.json({ error: "Manager role required" }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return NextResponse.json({ error: "Choose a lead" }, { status: 422 });

  const lead = await findRecord("leads", parsed.data.leadId);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (lead.customer_id) return NextResponse.json({ error: "This lead is already linked to a customer" }, { status: 409 });

  try {
    const customer = await insertRecord("customers", {
      name: String(lead.name ?? "Unnamed customer"),
      phone: lead.phone ? String(lead.phone) : undefined,
      email: lead.email ? String(lead.email) : undefined,
      notes: lead.address ? `Address given with the original request: ${lead.address}` : undefined,
    }, profile.id);

    let vehicle = null;
    if (lead.vehicle_type || lead.vehicle_description) {
      vehicle = await insertRecord("vehicles", {
        customer_id: customer.id,
        notes: [lead.vehicle_type, lead.vehicle_description].filter(Boolean).join(" — "),
      }, profile.id);
    }

    const updatedLead = await updateRecord("leads", lead.id, { stage: "won", customer_id: customer.id }, profile.id);
    return NextResponse.json({ customer, vehicle, lead: updatedLead }, { status: 201 });
  } catch (error) {
    console.error("[workflows/lead-to-customer] failed", error);
    return NextResponse.json({ error: "Could not convert this lead" }, { status: 500 });
  }
}
