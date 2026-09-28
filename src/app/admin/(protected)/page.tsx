import Link from "next/link";
import { getTenant } from "@/tenant/get-tenant";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listRecords, resourceCounts, type StoredRecord } from "@/lib/operations/store";
import { quoteInsights, staleLeads } from "@/lib/operations/insights";
import { formatMoney } from "@/lib/operations/money";

function isToday(value: unknown): boolean {
  if (typeof value !== "string" || !value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

export default async function TodayPage() {
  const tenant = await getTenant();
  const dbConnected = isSupabaseConfigured();
  const resources = ["leads", "appointments", "jobs", "customers"] as const;
  let counts = Object.fromEntries(resources.map((resource) => [resource, 0])) as Record<(typeof resources)[number], number>;
  let appointments: StoredRecord[] = [];
  let stale: StoredRecord[] = [];
  let quotes: Awaited<ReturnType<typeof quoteInsights>> = { open: [], expiring: [] };
  try {
    [counts, appointments, stale, quotes] = await Promise.all([
      resourceCounts([...resources]),
      listRecords("appointments", 500),
      staleLeads(),
      quoteInsights(),
    ]);
  } catch { /* The connection checklist below remains actionable. */ }

  const todaysAppointments = appointments.filter((item) => isToday(item.starts_at)).sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));
  const attentionCount = stale.length + quotes.expiring.length;
  const today = new Date().toISOString().slice(0, 10);

  const cards = [
    ["New leads", counts.leads, "/admin/leads"], ["Customers", counts.customers, "/admin/customers"],
    ["Appointments", counts.appointments, "/admin/jobs"], ["Active jobs", counts.jobs, "/admin/jobs"],
    ["Open quotes", quotes.open.length, "/admin/leads"],
  ] as const;

  return <div className="max-w-[1180px]">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#929292]">Today</p><h1 className="text-[28px] font-bold tracking-[-0.06em]">Operations at a glance.</h1><p className="mt-2 text-[12px] text-[#747474]">{tenant.brand.name}</p></div><span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${dbConnected ? "bg-[#e8f7ed] text-[#24613a]" : "bg-[#f4f4f4] text-[#747474]"}`}>{dbConnected ? "Database connected" : "Credentials not connected"}</span></div>
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label,value,href]) => <Link key={label} href={href} className="rounded-[14px] border border-[#e7e5e1] bg-white p-5 shadow-[0_14px_34px_rgba(20,26,40,0.05)] transition-transform hover:-translate-y-0.5"><span className="text-[11px] text-[#747474]">{label}</span><strong className="mt-2 block text-[30px] tracking-[-0.06em]">{value}</strong></Link>)}</div>

    <section className="mb-8 rounded-[14px] border border-[#e7e5e1] bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-[18px] font-bold">Today&apos;s appointments</h2><Link href="/admin/schedule" className="text-[12px] font-bold">Open crew calendar →</Link></div>{todaysAppointments.length ? <div className="grid gap-2">{todaysAppointments.map((item) => <div key={String(item.id)} className="grid grid-cols-[110px_1fr_auto] gap-3 rounded-[10px] bg-[#fafafa] px-4 py-3 text-[12px]"><span>{new Date(String(item.starts_at)).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span><span>{String(item.address ?? "Address pending")}</span><strong>{String(item.status ?? "requested")}</strong></div>)}</div> : <p className="rounded-[10px] bg-[#fafafa] px-4 py-6 text-center text-[12px] text-[#929292]">Nothing scheduled for today.</p>}</section>

    <section className="mb-8 rounded-[14px] border border-[#e7e5e1] bg-white p-5">
      <h2 className="text-[18px] font-bold">Needs attention {attentionCount > 0 && <span className="ml-1 rounded-full bg-[#a33] px-2 py-0.5 text-[11px] font-bold text-white align-middle">{attentionCount}</span>}</h2>
      <div className="mt-3 grid gap-2">
        {stale.map((lead) => <Link key={`lead-${lead.id}`} href="/admin/leads" className="grid grid-cols-[1fr_auto] gap-3 rounded-[10px] bg-[#f4f4f4] px-4 py-3 text-[12px]"><span>Lead {String(lead.name)} needs follow-up</span><strong className="text-[#747474]">New {String(lead.created_at).slice(0, 10)}</strong></Link>)}
        {quotes.expiring.map((quote) => <Link key={`quote-${quote.id}`} href="/admin/leads" className="grid grid-cols-[1fr_auto] gap-3 rounded-[10px] bg-[#f4f4f4] px-4 py-3 text-[12px]"><span>Quote {String(quote.quote_number)} ({formatMoney(quote.total)}) {String(quote.expires_on) < today ? "has expired" : "expiring soon"} — still {String(quote.status)}</span><strong className="text-[#747474]">{String(quote.expires_on) < today ? "Expired" : "Expires"} {String(quote.expires_on)}</strong></Link>)}
        {attentionCount === 0 && <p className="rounded-[10px] bg-[#fafafa] px-4 py-6 text-center text-[12px] text-[#929292]">Nothing needs attention right now.</p>}
      </div>
    </section>

    {!dbConnected && <section className="rounded-[14px] border border-dashed border-[#dcd9d4] p-5 text-[12px] leading-5 text-[#747474]"><strong className="text-[#050505]">Connection step:</strong> run the Supabase migrations and set the three Supabase environment values. The local development store keeps forms testable, but production intentionally refuses to store customer data on the server filesystem.</section>}
  </div>;
}
