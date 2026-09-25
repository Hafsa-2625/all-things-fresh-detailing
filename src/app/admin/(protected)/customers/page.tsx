import { ResourceManager } from "@/components/admin/resource-manager";
import { canManageStaff, canWrite, requireStaff } from "@/lib/admin/session";
import { listRecords } from "@/lib/operations/store";
import { relationLabels, relationOptions } from "@/lib/admin/relation-options";

export default async function CustomersPage() {
  const profile = await requireStaff();
  const editable = canWrite(profile.role);
  const [customers, vehicles] = await Promise.all([listRecords("customers"), listRecords("vehicles")]);
  const customerOptions = relationOptions(customers, relationLabels.customer);

  return <div className="grid max-w-[1280px] gap-7">
    <header><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#929292]">Customer records</p><h1 className="text-[26px] font-bold tracking-[-0.05em]">Customers & vehicles</h1></header>
    <ResourceManager resource="customers" title="Customers" initialRows={customers} columns={["name","phone","email","city","lifetime_value","created_at"]} canEdit={editable} canDelete={canManageStaff(profile.role)} detailHrefPrefix="/admin/customers" fields={[
      { name:"name",label:"Name",required:true },{ name:"phone",label:"Phone" },{ name:"email",label:"Email",type:"email" },{ name:"street",label:"Street" },{ name:"city",label:"City" },{ name:"state",label:"State",placeholder:"OH" },{ name:"postal_code",label:"ZIP" },{ name:"notes",label:"Notes",type:"textarea" },
    ]} />
    <ResourceManager resource="vehicles" title="Vehicles" initialRows={vehicles} columns={["customer_id","year","make","model","color","plate"]} canEdit={editable} canDelete={canManageStaff(profile.role)} fields={[
      { name:"customer_id",label:"Customer",type:"relation",options:customerOptions,required:true },{ name:"year",label:"Year",type:"number" },{ name:"make",label:"Make" },{ name:"model",label:"Model" },{ name:"color",label:"Color" },{ name:"plate",label:"Plate" },{ name:"notes",label:"Notes",type:"textarea" },
    ]} />
  </div>;
}
