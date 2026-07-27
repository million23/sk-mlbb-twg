import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";
import { canViewAuditLog } from "@/lib/admin/permissions";
import { requirePermission } from "@/lib/admin/require-permission";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/_authed/audit-logs")({
  beforeLoad: requirePermission(canViewAuditLog),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Committee"
      title="Audit log"
      description="Review admin actions across tournaments and committee tools. Superadmin only."
    />
  );
}
