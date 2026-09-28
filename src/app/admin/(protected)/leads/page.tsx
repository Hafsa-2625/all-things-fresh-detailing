import { ResourceManager } from "@/components/admin/resource-manager";
import { WorkflowPanel } from "@/components/admin/workflow-panel";
import { canManageStaff, canWrite, requireStaff } from "@/lib/admin/session";
import { listRecordsBy, listRecords, type StoredRecord } from "@/lib/operations/store";
import { relationLabels, relationOptions } from "@/lib/admin/relation-options";
import { LEAD_CREATED_EVENT } from "@/lib/email/lead-notification";
import { formatMoney } from "@/lib/operations/money";
import { isOpenQuote } from "@/lib/operations/quotes";
import { QUOTE_STATUSES } from "@/lib/operations/schemas";

export default async function LeadsPage() {
  const profile = await requireStaff();
  const editable = canWrite(profile.role);
  const [leads, customers, quotes, quoteItems, alerts] = await Promise.all([
    listRecords("leads"),
    listRecords("customers"),
    listRecords("quotes"),
    listRecords("quote_items", 500),
    listRecordsBy("notification_rules", "event", LEAD_CREATED_EVENT),
  ]);
  const customerOptions = relationOptions(customers, relationLabels.customer);
  const leadOptions = relationOptions(leads.filter((lead) => !lead.customer_id), relationLabels.lead);
  const anyLeadOptions = relationOptions(leads, relationLabels.lead);

  // A quote is named by its number and who it is for: the customer, or the lead until converted.
  const names = new Map([...leads, ...customers].map((row) => [String(row.id), String(row.name ?? "")]));
  const quoteName = (quote: StoredRecord) => [quote.quote_number, names.get(String(quote.customer_id ?? quote.lead_id))].filter(Boolean).join(" · ");
  const quoteOptions = relationOptions(quotes, quoteName);
  const schedulableOptions = relationOptions(quotes.filter(isOpenQuote), (quote) => `${quoteName(quote)} · ${formatMoney(quote.total)} · ${String(quote.status)}`);

  return <div className="grid max-w-[1280px] gap-7">
    <header><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#929292]">Pipeline</p><h1 className="text-[26px] font-bold tracking-[-0.05em]">Leads</h1></header>
    <ResourceManager resource="leads" title="Leads" description="Website requests land here automatically. Move each lead through the pipeline without changing the public form." initialRows={leads} columns={["name","phone","requested_service","preferred_date","source","stage","customer_id"]} canEdit={editable} canDelete={canManageStaff(profile.role)} statusField="stage" statusOptions={["new","contacted","qualified","quoted","won","lost","spam"]} fields={[
      { name:"name",label:"Name",required:true },{ name:"phone",label:"Phone",required:true },{ name:"email",label:"Email",type:"email" },{ name:"requested_service",label:"Requested service" },{ name:"source",label:"Source",placeholder:"phone, referral, website" },{ name:"stage",label:"Stage",type:"select",options:["new","contacted","qualified","quoted","won","lost"] },{ name:"customer_id",label:"Customer",type:"relation",options:customerOptions },
    ]} />

    {editable && <WorkflowPanel title="Convert a lead to a customer" description="Creates the customer record (and a vehicle, if one was named) and links the lead to it." endpoint="/api/admin/workflows/lead-to-customer" fields={[{ name:"leadId", label:"Lead", type:"select", options:leadOptions, required:true }]} successMessage="Converted — see the Customers page." />}

    <ResourceManager resource="quotes" title="Quotes" description="Price a job for a lead or customer. Subtotal and total are worked out from the line items; only tax is typed in. An accepted quote's prices are locked." initialRows={quotes} columns={["quote_number","lead_id","customer_id","status","subtotal","tax","total","expires_on"]} moneyColumns={["subtotal","tax","total"]} canEdit={editable} canDelete={canManageStaff(profile.role)} statusField="status" statusOptions={[...QUOTE_STATUSES]} fields={[
      { name:"lead_id",label:"Lead",type:"relation",options:anyLeadOptions },{ name:"customer_id",label:"Customer",type:"relation",options:customerOptions },{ name:"tax",label:"Tax ($)",type:"number",step:"0.01",placeholder:"0.00" },{ name:"expires_on",label:"Expires on",type:"date" },{ name:"notes",label:"Notes",type:"textarea" },
    ]} />

    <ResourceManager resource="quote_items" title="Quote line items" description="Each line is quantity × unit price. The quote's subtotal and total update as lines are added, changed or removed." initialRows={quoteItems} columns={["quote_id","description","quantity","unit_price","line_total"]} moneyColumns={["unit_price","line_total"]} canEdit={editable} fields={[
      { name:"quote_id",label:"Quote",type:"relation",options:quoteOptions,required:true },{ name:"description",label:"Description",required:true,placeholder:"e.g. Full interior detail" },{ name:"quantity",label:"Quantity",type:"number",step:"0.01",placeholder:"1" },{ name:"unit_price",label:"Unit price ($)",type:"number",step:"0.01",required:true },
    ]} />

    {editable && <WorkflowPanel title="Schedule an accepted quote" description="Books the visit: creates the appointment and the job for the quote's customer and marks the quote accepted. Convert the lead to a customer first." endpoint="/api/admin/workflows/schedule-quote" fields={[{ name:"quoteId", label:"Quote", type:"select", options:schedulableOptions, required:true },{ name:"startsAt", label:"Starts", type:"datetime-local", required:true }]} successMessage="Scheduled — the appointment and job are on the Jobs page." />}

    <ResourceManager resource="notification_rules" title="New-lead emails" description="Everyone listed here gets an email for each website request. Admins only." initialRows={alerts} columns={["destination","active"]} canEdit={canManageStaff(profile.role)} fields={[
      { name:"destination",label:"Email address",type:"email",required:true },{ name:"event",label:"Event",type:"select",options:[LEAD_CREATED_EVENT],required:true },{ name:"channel",label:"Channel",type:"select",options:["email"],required:true },{ name:"active",label:"Active",type:"select",options:["true","false"] },
    ]} />
  </div>;
}
