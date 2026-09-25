import { ResourceManager } from "@/components/admin/resource-manager";
import { WorkflowPanel } from "@/components/admin/workflow-panel";
import { canManageStaff, canWrite, requireStaff } from "@/lib/admin/session";
import { listRecordsBy, listRecords } from "@/lib/operations/store";
import { relationLabels, relationOptions } from "@/lib/admin/relation-options";
import { LEAD_CREATED_EVENT } from "@/lib/email/lead-notification";

export default async function LeadsPage() {
  const profile = await requireStaff();
  const editable = canWrite(profile.role);
  const [leads, customers, alerts] = await Promise.all([
    listRecords("leads"),
    listRecords("customers"),
    listRecordsBy("notification_rules", "event", LEAD_CREATED_EVENT),
  ]);
  const customerOptions = relationOptions(customers, relationLabels.customer);
  const leadOptions = relationOptions(leads.filter((lead) => !lead.customer_id), relationLabels.lead);

  return <div className="grid max-w-[1280px] gap-7">
    <header><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#929292]">Pipeline</p><h1 className="text-[26px] font-bold tracking-[-0.05em]">Leads</h1></header>
    <ResourceManager resource="leads" title="Leads" description="Website requests land here automatically. Move each lead through the pipeline without changing the public form." initialRows={leads} columns={["name","phone","requested_service","preferred_date","source","stage","customer_id"]} canEdit={editable} canDelete={canManageStaff(profile.role)} statusField="stage" statusOptions={["new","contacted","qualified","quoted","won","lost","spam"]} fields={[
      { name:"name",label:"Name",required:true },{ name:"phone",label:"Phone",required:true },{ name:"email",label:"Email",type:"email" },{ name:"requested_service",label:"Requested service" },{ name:"source",label:"Source",placeholder:"phone, referral, website" },{ name:"stage",label:"Stage",type:"select",options:["new","contacted","qualified","quoted","won","lost"] },{ name:"customer_id",label:"Customer",type:"relation",options:customerOptions },
    ]} />

    {editable && <WorkflowPanel title="Convert a lead to a customer" description="Creates the customer record (and a vehicle, if one was named) and links the lead to it." endpoint="/api/admin/workflows/lead-to-customer" fields={[{ name:"leadId", label:"Lead", type:"select", options:leadOptions, required:true }]} successMessage="Converted — see the Customers page." />}

    <ResourceManager resource="notification_rules" title="New-lead emails" description="Everyone listed here gets an email for each website request. Admins only." initialRows={alerts} columns={["destination","active"]} canEdit={canManageStaff(profile.role)} fields={[
      { name:"destination",label:"Email address",type:"email",required:true },{ name:"event",label:"Event",type:"select",options:[LEAD_CREATED_EVENT],required:true },{ name:"channel",label:"Channel",type:"select",options:["email"],required:true },{ name:"active",label:"Active",type:"select",options:["true","false"] },
    ]} />
  </div>;
}
