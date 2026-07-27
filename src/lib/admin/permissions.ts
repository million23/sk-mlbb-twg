/**
 * Client-side RBAC for the admin app.
 * Keep UI gates aligned with PocketBase collection rules where possible.
 *
 * Roles:
 * - `superadmin` — full access (create/archive tournaments, admins CRUD, audit log)
 * - `staff` — day-to-day tournament workspace ops; can view admins list;
 *   cannot create/archive tournaments, manage admins, or view audit
 */

export type AdminRole = "superadmin" | "staff";

export type AdminAuthRecord = {
  id?: string;
  role?: string | null;
  is_active?: boolean | null;
  isActive?: boolean | null;
} | null;

export function getAdminRole(
  authRecord: AdminAuthRecord | undefined,
): AdminRole | null {
  const role = authRecord?.role;
  if (role === "superadmin" || role === "staff") return role;
  return null;
}

export function isSuperadmin(
  authRecord: AdminAuthRecord | undefined,
): boolean {
  return getAdminRole(authRecord) === "superadmin";
}

export function isStaff(authRecord: AdminAuthRecord | undefined): boolean {
  return getAdminRole(authRecord) === "staff";
}

/** Active account (defaults true when field missing). */
export function isAdminActive(
  authRecord: AdminAuthRecord | undefined,
): boolean {
  if (!authRecord) return false;
  const active = authRecord.is_active ?? authRecord.isActive;
  if (active === undefined || active === null) return true;
  return active === true;
}

/** Any signed-in admin role may enter the app shell. */
export function canAccessAdminApp(
  authRecord: AdminAuthRecord | undefined,
): boolean {
  return Boolean(getAdminRole(authRecord) && isAdminActive(authRecord));
}

/**
 * Day-to-day tournament workspace access (dashboard, events, roster, teams, matches).
 * Both superadmin and staff.
 */
export function canAccessTournamentOps(
  authRecord: AdminAuthRecord | undefined,
): boolean {
  return canAccessAdminApp(authRecord);
}

export function canViewDashboard(authRecord: AdminAuthRecord | undefined) {
  return canAccessTournamentOps(authRecord);
}

export function canViewTournaments(authRecord: AdminAuthRecord | undefined) {
  return canAccessTournamentOps(authRecord);
}

/** Create / edit / archive / restore platform tournaments — superadmin only. */
export function canManageTournaments(authRecord: AdminAuthRecord | undefined) {
  return isSuperadmin(authRecord) && isAdminActive(authRecord);
}

export function canViewParticipants(authRecord: AdminAuthRecord | undefined) {
  return canAccessTournamentOps(authRecord);
}

export function canManageParticipants(authRecord: AdminAuthRecord | undefined) {
  return canAccessTournamentOps(authRecord);
}

export function canViewTeams(authRecord: AdminAuthRecord | undefined) {
  return canAccessTournamentOps(authRecord);
}

export function canManageTeams(authRecord: AdminAuthRecord | undefined) {
  return canAccessTournamentOps(authRecord);
}

export function canViewMatches(authRecord: AdminAuthRecord | undefined) {
  return canAccessTournamentOps(authRecord);
}

export function canManageMatches(authRecord: AdminAuthRecord | undefined) {
  return canAccessTournamentOps(authRecord);
}

export function canViewTeamStanding(authRecord: AdminAuthRecord | undefined) {
  return canAccessTournamentOps(authRecord);
}

/** View the committee admins directory. */
export function canViewAdmins(
  authRecord: AdminAuthRecord | undefined,
): boolean {
  return canAccessAdminApp(authRecord);
}

/** Create / edit / delete admin accounts. */
export function canManageAdmins(
  authRecord: AdminAuthRecord | undefined,
): boolean {
  return isSuperadmin(authRecord) && isAdminActive(authRecord);
}

/** Remove another admin (never self). */
export function canDeleteAdmin(
  authRecord: AdminAuthRecord | undefined,
  targetAdminId: string | undefined,
): boolean {
  if (!canManageAdmins(authRecord)) return false;
  if (!targetAdminId || !authRecord?.id) return false;
  return authRecord.id !== targetAdminId;
}

/** Audit log list/view — superadmin only. */
export function canViewAuditLog(
  authRecord: AdminAuthRecord | undefined,
): boolean {
  return isSuperadmin(authRecord) && isAdminActive(authRecord);
}

/** Throw if a capability check fails (mutations). */
export function assertPermission(
  allowed: boolean,
  message = "You do not have permission to perform this action.",
): asserts allowed is true {
  if (!allowed) throw new Error(message);
}

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  superadmin: "Superadmin",
  staff: "Staff",
};

export const ADMIN_ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "superadmin", label: ADMIN_ROLE_LABELS.superadmin },
  { value: "staff", label: ADMIN_ROLE_LABELS.staff },
];
