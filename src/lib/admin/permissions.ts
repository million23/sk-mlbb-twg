/**
 * Client-side gate for audit log UI. Keep in sync with PocketBase `audit_log`
 * list/view rules (e.g. only `superadmin` may list).
 */
export { canViewAuditLog } from "@/lib/legacy/admin-permissions";
