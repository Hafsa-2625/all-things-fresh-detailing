"use client";

import type { StoredRecord } from "@/lib/operations/store";

interface StaffColumn {
  id: string;
  email: string;
  display_name?: string | null;
}

const UNASSIGNED: StaffColumn = { id: "", email: "Unassigned" };

export function WeekCalendar({ weekStart, appointments, staff, conflicts, arrivalByAppointment }: {
  weekStart: string;
  appointments: StoredRecord[];
  staff: StaffColumn[];
  conflicts: string[];
  arrivalByAppointment: Record<string, string>;
}) {
  const conflictSet = new Set(conflicts);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${weekStart}T00:00:00`);
    date.setDate(date.getDate() + index);
    return date;
  });
  const columns = [...staff, UNASSIGNED];

  function blocksFor(day: Date, staffId: string) {
    const dayStart = new Date(day);
    const dayEnd = new Date(day);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return appointments
      .filter((appointment) => {
        const start = new Date(String(appointment.starts_at));
        const assigned = appointment.assigned_to ? String(appointment.assigned_to) : "";
        return start >= dayStart && start < dayEnd && assigned === staffId;
      })
      .sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));
  }

  return (
    <div className="overflow-x-auto rounded-[14px] border border-[#e7e5e1] bg-white p-4 shadow-[0_14px_34px_rgba(20,26,40,0.05)]">
      <table className="w-full min-w-[900px] border-collapse text-left text-[12px]">
        <thead>
          <tr>
            <th className="w-[100px] px-2 py-2" />
            {columns.map((person) => (
              <th key={person.id || "unassigned"} className="px-2 py-2 text-[11px] font-bold text-[#3d3d3d]">
                {person.display_name || person.email}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.toISOString()} className="border-t border-[#efedea] align-top">
              <td className="px-2 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#929292]">
                {day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </td>
              {columns.map((person) => (
                <td key={person.id || "unassigned"} className="px-2 py-3">
                  <div className="grid gap-1.5">
                    {blocksFor(day, person.id).map((appointment) => {
                      const id = String(appointment.id);
                      const conflicted = conflictSet.has(id);
                      const arrival = arrivalByAppointment[id];
                      return (
                        <div key={id} className={`rounded-[8px] border px-2 py-1.5 text-[11px] leading-4 ${conflicted ? "border-[#e2b8b8] bg-[#fdf3f3]" : "border-[#dcd9d4] bg-[#fafafa]"}`}>
                          <p className="font-bold">
                            {new Date(String(appointment.starts_at)).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                            {appointment.status ? ` · ${String(appointment.status)}` : ""}
                          </p>
                          {appointment.address ? <p className="text-[#747474]">{String(appointment.address)}</p> : null}
                          {arrival ? <p className="text-[#3268B5]">Arrival: {arrival}</p> : null}
                          {conflicted && <p className="font-bold text-[#a33]">Double-booked</p>}
                        </div>
                      );
                    })}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
