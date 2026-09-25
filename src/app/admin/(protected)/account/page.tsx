import { requireStaff } from "@/lib/admin/session";
import { PasswordForm } from "./password-form";

export default async function AccountPage() {
  const profile = await requireStaff();

  return <div className="grid max-w-[1000px] gap-7">
    <header><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#929292]">Signed in as {profile.email}</p><h1 className="text-[26px] font-bold tracking-[-0.05em]">My account</h1><p className="mt-2 text-[12px] text-[#747474]">Set a password to sign in without waiting for an email. Magic links keep working either way.</p></header>
    <section className="rounded-[14px] border border-[#e7e5e1] bg-white p-5"><h2 className="mb-4 text-[18px] font-bold">Password</h2><PasswordForm email={profile.email} /></section>
  </div>;
}
