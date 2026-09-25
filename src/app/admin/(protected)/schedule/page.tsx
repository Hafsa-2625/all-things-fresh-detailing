import Link from "next/link";
import { requireStaff } from "@/lib/admin/session";
import { listRecords } from "@/lib/operations/store";
import { listStaff } from "@/lib/admin/staff-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findConflicts } from "@/lib/operations/scheduling";
import { WeekCalendar } from "@/components/admin/week-calendar";

function mondayOf(date: Date): Date {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7; // Monday = 0
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  await requireStaff();
  const { week } = await searchParams;
  const admin = createSupabaseAdminClient();

  const [appointments, jobs, staff] = await Promise.all([
    listRecords("appointments", 500),
    listRecords("jobs", 500),
    admin ? listStaff(admin) : Promise.resolve([]),
  ]);

  const parsedWeek = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? new Date(`${week}T00:00:00`) : new Date();
  const weekStart = mondayOf(parsedWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const inWeek = appointments.filter((appointment) => {
    const start = new Date(String(appointment.starts_at));
    return start >= weekStart && start < weekEnd;
  });

  const conflicts = findConflicts(inWeek.map((appointment) => ({
    id: String(appointment.id),
    starts_at: String(appointment.starts_at),
    ends_at: appointment.ends_at ? String(appointment.ends_at) : null,
    assigned_to: appointment.assigned_to ? String(appointment.assigned_to) : null,
  })));

  const arrivalByAppointment = Object.fromEntries(
    jobs.filter((job) => job.appointment_id && job.arrival_window).map((job) => [String(job.appointment_id), String(job.arrival_window)]),
  );

  const prevWeek = new Date(weekStart);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const weekEndDisplay = new Date(weekEnd);
  weekEndDisplay.setDate(weekEndDisplay.getDate() - 1);

  return <div className="grid max-w-[1280px] gap-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#929292]">Dispatch</p>
        <h1 className="text-[26px] font-bold tracking-[-0.05em]">Crew calendar</h1>
        <p className="mt-1 text-[12px] text-[#747474]">{weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – {weekEndDisplay.toLocaleDateString(undefined, { month: "short", day: "numeric" })}. Assign staff to an appointment from Jobs & schedule — double-booked blocks are flagged here, not blocked.</p>
      </div>
      <nav className="flex gap-2 text-[12px] font-bold">
        <Link href={`/admin/schedule?week=${isoDate(prevWeek)}`} className="rounded-full border border-[#dcd9d4] bg-white px-4 py-2 transition-colors hover:border-[#b9b4ad] hover:bg-[#f4f4f5]">← Prev week</Link>
        <Link href="/admin/schedule" className="rounded-full border border-[#dcd9d4] bg-white px-4 py-2 transition-colors hover:border-[#b9b4ad] hover:bg-[#f4f4f5]">This week</Link>
        <Link href={`/admin/schedule?week=${isoDate(nextWeek)}`} className="rounded-full border border-[#dcd9d4] bg-white px-4 py-2 transition-colors hover:border-[#b9b4ad] hover:bg-[#f4f4f5]">Next week →</Link>
      </nav>
    </header>
    <WeekCalendar weekStart={isoDate(weekStart)} appointments={inWeek} staff={staff} conflicts={[...conflicts]} arrivalByAppointment={arrivalByAppointment} />
  </div>;
}
