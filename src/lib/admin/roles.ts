export const STAFF_ROLES = ["editor", "manager", "admin", "super_admin"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_RANK: Record<StaffRole, number> = {
  editor: 0,
  manager: 1,
  admin: 2,
  super_admin: 3,
};

/** Operational and content writes. */
export function canWrite(role: StaffRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.manager;
}

/** Inviting staff and changing access. */
export function canManageStaff(role: StaffRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.admin;
}

/**
 * Admins manage editors and managers; only a super admin can grant, change,
 * or remove admin-level access. Used both for the role being granted and for
 * the current role of the person being changed.
 */
export function canAssignRole(actor: StaffRole, target: StaffRole): boolean {
  if (actor === "super_admin") return true;
  return actor === "admin" && ROLE_RANK[target] <= ROLE_RANK.manager;
}
