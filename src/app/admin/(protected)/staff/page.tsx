import { ResourceManager } from "@/components/admin/resource-manager";
import { StaffRoster } from "@/components/admin/staff-roster";
import { canAssignRole, canManageStaff, requireStaff, STAFF_ROLES } from "@/lib/admin/session";
import { listStaff } from "@/lib/admin/staff-access";
import { listRecords } from "@/lib/operations/store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function StaffPage() {
  const profile = await requireStaff();
  const admin = createSupabaseAdminClient();
  const [invites, staff] = await Promise.all([listRecords("staff_invites"), admin ? listStaff(admin) : Promise.resolve([])]);
  const manageable = canManageStaff(profile.role);
  const inviteRoles = STAFF_ROLES.filter((role) => canAssignRole(profile.role, role));

  return <div className="grid max-w-[1000px] gap-7">
    <header><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#929292]">Access control</p><h1 className="text-[26px] font-bold tracking-[-0.05em]">Staff & permissions</h1><p className="mt-2 text-[12px] text-[#747474]">Your role: {profile.role.replace("_", " ")}. Editors can read; managers operate the business and content; admins also manage editor and manager access; super admins manage all access.</p></header>
    <StaffRoster initialRows={staff} currentUserId={profile.id} actorRole={profile.role} canManage={manageable} />
    <ResourceManager resource="staff_invites" title="Staff invites" description="Invited people sign in at /admin/login with the invited email. Access starts only after they open the emailed magic link; they can then set a password under My account. Invites expire after 7 days unless you set a date." initialRows={invites} columns={["email","role","expires_at","accepted_at","created_at"]} canEdit={manageable} fields={[
      { name:"email",label:"Email",type:"email",required:true },{ name:"role",label:"Role",type:"select",options:inviteRoles,required:true },{ name:"expires_at",label:"Expires",type:"datetime-local" },
    ]} />
  </div>;
}
