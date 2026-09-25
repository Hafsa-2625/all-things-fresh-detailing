import { ResourceManager } from "@/components/admin/resource-manager";
import { canManageStaff, canWrite, requireStaff } from "@/lib/admin/session";
import { listRecords } from "@/lib/operations/store";
import { listStaff } from "@/lib/admin/staff-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { relationLabels, relationOptions } from "@/lib/admin/relation-options";

export default async function JobsPage() {
  const profile = await requireStaff();
  const editable = canWrite(profile.role);
  const admin = createSupabaseAdminClient();
  const [appointments, jobs, leads, customers, vehicles, services, staff] = await Promise.all([
    listRecords("appointments"),
    listRecords("jobs"),
    listRecords("leads"),
    listRecords("customers"),
    listRecords("vehicles"),
    listRecords("services"),
    admin ? listStaff(admin) : Promise.resolve([]),
  ]);

  const leadOptions = relationOptions(leads, relationLabels.lead);
  const customerOptions = relationOptions(customers, relationLabels.customer);
  const vehicleOptions = relationOptions(vehicles, relationLabels.vehicle);
  const serviceOptions = relationOptions(services, relationLabels.service);
  const staffOptions = relationOptions(staff as unknown as Record<string, unknown>[], relationLabels.staff);
  const appointmentOptions = relationOptions(appointments, relationLabels.appointment);

  return <div className="grid max-w-[1280px] gap-7">
    <header><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#929292]">Route board</p><h1 className="text-[26px] font-bold tracking-[-0.05em]">Jobs & schedule</h1></header>
    <ResourceManager resource="appointments" title="Appointments" initialRows={appointments} columns={["starts_at","ends_at","status","address","assigned_to","customer_id"]} canEdit={editable} canDelete={canManageStaff(profile.role)} statusField="status" statusOptions={["requested","scheduled","confirmed","en_route","in_progress","complete","cancelled","no_show"]} fields={[
      { name:"starts_at",label:"Starts",type:"datetime-local",required:true },{ name:"ends_at",label:"Ends",type:"datetime-local" },{ name:"status",label:"Status",type:"select",options:["requested","scheduled","confirmed"] },{ name:"lead_id",label:"Lead",type:"relation",options:leadOptions },{ name:"customer_id",label:"Customer",type:"relation",options:customerOptions },{ name:"vehicle_id",label:"Vehicle",type:"relation",options:vehicleOptions },{ name:"service_id",label:"Service",type:"relation",options:serviceOptions },{ name:"assigned_to",label:"Assigned to",type:"relation",options:staffOptions },{ name:"address",label:"Service address" },{ name:"notes",label:"Notes",type:"textarea" },
    ]} />
    <ResourceManager resource="jobs" title="Jobs" initialRows={jobs} columns={["scheduled_date","arrival_window","address","status","customer_id","vehicle_id"]} canEdit={editable} canDelete={canManageStaff(profile.role)} statusField="status" statusOptions={["scheduled","en_route","in_progress","quality_check","complete","cancelled"]} fields={[
      { name:"appointment_id",label:"Appointment",type:"relation",options:appointmentOptions },{ name:"customer_id",label:"Customer",type:"relation",options:customerOptions },{ name:"vehicle_id",label:"Vehicle",type:"relation",options:vehicleOptions },{ name:"scheduled_date",label:"Date",type:"date" },{ name:"arrival_window",label:"Arrival window",placeholder:"e.g. 9am–11am" },{ name:"address",label:"Address" },{ name:"status",label:"Status",type:"select",options:["scheduled","en_route","in_progress","quality_check","complete"] },{ name:"crew_ids",label:"Crew",type:"relation",options:staffOptions,multiple:true },{ name:"checklist",label:"Checklist",type:"repeater",repeaterFields:[{name:"title",label:"Task"},{name:"done",label:"Done (true/false)"}]},{ name:"notes",label:"Crew notes",type:"textarea" },
    ]} />
  </div>;
}
