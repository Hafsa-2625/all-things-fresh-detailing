import { ResourceManager } from "@/components/admin/resource-manager";
import { canWrite, requireStaff } from "@/lib/admin/session";
import { listRecords } from "@/lib/operations/store";

export default async function AdminRedirectsPage() {
  const profile = await requireStaff();
  const rows = await listRecords("redirects");
  return <div className="max-w-[1280px]">
    <ResourceManager resource="redirects" title="Redirects" description="Preserve search equity when a published URL changes. Permanent 301 redirects are the normal choice for retired URLs." initialRows={rows} columns={["source_path","destination_path","status_code","active","hits"]} canEdit={canWrite(profile.role)} fields={[
      { name:"source_path",label:"From",placeholder:"/old-url",required:true },{ name:"destination_path",label:"To",placeholder:"/new-url",required:true },{ name:"status_code",label:"Code",type:"select",options:["301","302","307","308"] },{ name:"active",label:"Active",type:"select",options:["true","false"] },
    ]} />
  </div>;
}
