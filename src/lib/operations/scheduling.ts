import "server-only";

const DEFAULT_DURATION_MS = 60 * 60 * 1000;

interface Interval {
  id: string;
  starts_at: string;
  ends_at?: string | null;
  assigned_to?: string | null;
}

function overlaps(a: Interval, b: Interval): boolean {
  const aStart = new Date(a.starts_at).getTime();
  const aEnd = a.ends_at ? new Date(a.ends_at).getTime() : aStart + DEFAULT_DURATION_MS;
  const bStart = new Date(b.starts_at).getTime();
  const bEnd = b.ends_at ? new Date(b.ends_at).getTime() : bStart + DEFAULT_DURATION_MS;
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Ids of appointments assigned to the same staff member with overlapping time windows. A flag for
 * the calendar to warn about, not something that blocks saving — an intentional double-booking
 * (e.g. two short back-to-back jobs) is sometimes legitimate.
 */
export function findConflicts(appointments: Interval[]): Set<string> {
  const conflicts = new Set<string>();
  const byStaff = new Map<string, Interval[]>();
  for (const appointment of appointments) {
    if (!appointment.assigned_to) continue;
    const list = byStaff.get(appointment.assigned_to) ?? [];
    list.push(appointment);
    byStaff.set(appointment.assigned_to, list);
  }
  for (const list of byStaff.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (overlaps(list[i], list[j])) {
          conflicts.add(list[i].id);
          conflicts.add(list[j].id);
        }
      }
    }
  }
  return conflicts;
}
