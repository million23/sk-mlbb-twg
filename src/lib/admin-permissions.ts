/**
 * Client-side gate for audit log UI. Keep in sync with PocketBase `audit_log`
 * list/view rules (e.g. only `superadmin` may list).
 */
export function canViewAuditLog(
  authRecord: { role?: string } | null | undefined,
): boolean {
  return authRecord?.role === "superadmin";
}
