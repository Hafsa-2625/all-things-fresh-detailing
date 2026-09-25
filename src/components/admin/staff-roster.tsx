"use client";

import { useState } from "react";
import { canAssignRole, STAFF_ROLES, type StaffRole } from "@/lib/admin/roles";

export interface StaffRosterRow {
  id: string;
  email: string;
  role: StaffRole;
  active: boolean;
  created_at: string;
}

export function StaffRoster({ initialRows, currentUserId, actorRole, canManage }: {
  initialRows: StaffRosterRow[];
  currentUserId: string;
  actorRole: StaffRole;
  canManage: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const grantableRoles = STAFF_ROLES.filter((role) => canAssignRole(actorRole, role));

  async function save(row: StaffRosterRow, values: { role?: StaffRole; active?: boolean }) {
    setBusyId(row.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: row.id, ...values }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not update access");
      setRows((current) => current.map((item) => item.id === row.id ? payload.row : item));
      setMessage(`Access updated for ${row.email}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update access");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-[14px] border border-[#e7e5e1] bg-white p-5 shadow-[0_14px_34px_rgba(20,26,40,0.05)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.03em]">Staff accounts</h2>
          <p className="mt-1 max-w-[700px] text-[12px] leading-5 text-[#747474]">
            Admins manage editors and managers. Only a super admin can change admin-level access. Deactivating someone signs them out and blocks future sign-in.
          </p>
        </div>
        <span aria-live="polite" className="text-[12px] text-[#3268B5]">{message}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[#e7e5e1] text-[10px] uppercase tracking-[0.08em] text-[#929292]">
              <th className="px-3 py-2 font-bold">Email</th>
              <th className="px-3 py-2 font-bold">Role</th>
              <th className="px-3 py-2 font-bold">Status</th>
              <th className="px-3 py-2 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const editable = canManage && row.id !== currentUserId && canAssignRole(actorRole, row.role);
              const busy = busyId === row.id;
              return (
                <tr key={row.id} className="border-b border-[#efedea] align-middle">
                  <td className="px-3 py-3 text-[#4f4f4f]">{row.email}{row.id === currentUserId && <span className="ml-2 text-[#929292]">(you)</span>}</td>
                  <td className="px-3 py-3">
                    {editable ? (
                      <select
                        aria-label={`Role for ${row.email}`}
                        value={row.role}
                        disabled={busy}
                        onChange={(event) => save(row, { role: event.target.value as StaffRole })}
                        className="rounded-full border border-[#dcd9d4] bg-white px-3 py-1.5 text-[11px]"
                      >
                        {grantableRoles.map((role) => <option key={role} value={role}>{role.replace("_", " ")}</option>)}
                      </select>
                    ) : (
                      <span className="text-[#4f4f4f]">{row.role.replace("_", " ")}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={row.active ? "text-[#24613a]" : "text-[#929292]"}>{row.active ? "Active" : "No access"}</span>
                  </td>
                  <td className="px-3 py-3">
                    {editable && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => save(row, { active: !row.active })}
                        className="rounded-full border border-[#dcd9d4] bg-white px-3 py-1.5 text-[11px] font-bold disabled:opacity-50"
                      >
                        {row.active ? "Deactivate" : "Reactivate"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={4} className="px-3 py-8 text-center text-[#929292]">No staff accounts yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
