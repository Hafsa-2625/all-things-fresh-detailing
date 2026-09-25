import Link from "next/link";
import { notFound } from "next/navigation";
import { findRecord, listRecordsBy } from "@/lib/operations/store";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await findRecord("customers", id);
  if (!customer) notFound();

  const [vehicles, appointments, jobs] = await Promise.all([
    listRecordsBy("vehicles", "customer_id", id),
    listRecordsBy("appointments", "customer_id", id),
    listRecordsBy("jobs", "customer_id", id),
  ]);

  return <div className="grid max-w-[1000px] gap-6">
    <div>
      <Link href="/admin/customers" className="text-[12px] font-bold text-[#3268B5]">← Customers & vehicles</Link>
      <header className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#929292]">Customer</p>
          <h1 className="text-[26px] font-bold tracking-[-0.05em]">{String(customer.name)}</h1>
          <p className="mt-1 text-[12px] text-[#747474]">{[customer.phone, customer.email].filter(Boolean).join(" · ") || "No contact details on file"}</p>
        </div>
      </header>
    </div>

    {Boolean(customer.street || customer.city) && (
      <section className="rounded-[14px] border border-[#e7e5e1] bg-white p-5 text-[12px] leading-5 text-[#4f4f4f]">
        {[customer.street, customer.city, customer.state, customer.postal_code].filter(Boolean).join(", ")}
      </section>
    )}

    <section className="rounded-[14px] border border-[#e7e5e1] bg-white p-5">
      <h2 className="text-[16px] font-bold tracking-[-0.03em]">Vehicles</h2>
      {vehicles.length ? <div className="mt-3 grid gap-2">{vehicles.map((vehicle) => <div key={String(vehicle.id)} className="rounded-[10px] bg-[#fafafa] px-4 py-3 text-[12px]">{[vehicle.year, vehicle.make, vehicle.model, vehicle.color].filter(Boolean).join(" ") || "Vehicle"}{vehicle.plate ? ` — ${vehicle.plate}` : ""}</div>)}</div> : <p className="mt-3 text-[12px] text-[#929292]">No vehicles on file.</p>}
    </section>

    <section className="rounded-[14px] border border-[#e7e5e1] bg-white p-5">
      <h2 className="text-[16px] font-bold tracking-[-0.03em]">Appointments & jobs</h2>
      {appointments.length || jobs.length ? (
        <div className="mt-3 grid gap-2">
          {appointments.map((appointment) => <div key={String(appointment.id)} className="grid grid-cols-[1fr_auto] gap-3 rounded-[10px] bg-[#fafafa] px-4 py-3 text-[12px]"><span>{String(appointment.starts_at ?? "Unscheduled")} — {String(appointment.address ?? "Address pending")}</span><strong>{String(appointment.status ?? "requested")}</strong></div>)}
          {jobs.map((job) => <div key={String(job.id)} className="grid grid-cols-[1fr_auto] gap-3 rounded-[10px] bg-[#f4f4f4] px-4 py-3 text-[12px]"><span>Job — {String(job.scheduled_date ?? job.address ?? "Details pending")}</span><strong>{String(job.status ?? "scheduled")}</strong></div>)}
        </div>
      ) : <p className="mt-3 text-[12px] text-[#929292]">No visit history yet.</p>}
    </section>
  </div>;
}
