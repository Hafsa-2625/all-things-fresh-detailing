import { ResourceManager } from "@/components/admin/resource-manager";
import { canWrite, requireStaff } from "@/lib/admin/session";
import { listRecords } from "@/lib/operations/store";

export default async function AdminServicesPage() {
  const profile = await requireStaff();
  const rows = await listRecords("services");
  return <div className="max-w-[1280px]">
    <ResourceManager resource="services" title="Service catalog" description="Edit the operational catalog used for scheduling. Public page copy is edited under Content fields; public layout controls remain locked." initialRows={rows} columns={["name","slug","price_from","status","seo_title","media_path"]} canEdit={canWrite(profile.role)} statusField="status" statusOptions={["draft","published","archived"]} fields={[
      { name:"name",label:"Name",required:true },{ name:"slug",label:"Slug",required:true },{ name:"short_blurb",label:"Short blurb",type:"textarea",required:true },{ name:"long_body",label:"Long body",type:"textarea" },{ name:"price_from",label:"Price from",type:"number" },{ name:"status",label:"Status",type:"select",options:["draft","published","archived"] },{ name:"seo_title",label:"SEO title" },{ name:"seo_description",label:"Meta description",type:"textarea" },{ name:"media_path",label:"Approved media path" },
    ]} />
  </div>;
}
