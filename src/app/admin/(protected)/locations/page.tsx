import { ResourceManager } from "@/components/admin/resource-manager";
import { canWrite, requireStaff } from "@/lib/admin/session";
import { listRecords } from "@/lib/operations/store";

export default async function AdminLocationsPage() {
  const profile = await requireStaff();
  const rows = await listRecords("locations");
  return <div className="max-w-[1280px]">
    <ResourceManager resource="locations" title="Service-area catalog" description="Create and edit the operational city catalog. Public location URLs and copy are managed under Content fields and must use genuinely local, approved text." initialRows={rows} columns={["city","state","slug","status","seo_title"]} canEdit={canWrite(profile.role)} statusField="status" statusOptions={["draft","review","published","archived"]} fields={[
      { name:"city",label:"City",required:true },{ name:"state",label:"State",placeholder:"OH" },{ name:"slug",label:"Slug",required:true },{ name:"local_intro",label:"Unique local copy (120+ characters)",type:"textarea",required:true },{ name:"neighborhoods",label:"Neighborhoods",type:"repeater" },{ name:"status",label:"Status",type:"select",options:["draft","review","published","archived"] },{ name:"seo_title",label:"SEO title" },{ name:"seo_description",label:"Meta description",type:"textarea" },
    ]} />
  </div>;
}
