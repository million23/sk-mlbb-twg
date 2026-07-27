import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";
import { canViewAuditLog } from "@/lib/admin/permissions";
import { pb } from "@/lib/pocketbase";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/_authed/audit-logs")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!canViewAuditLog(pb.authStore.record as { role?: string })) {
      throw redirect({ to: "/app" });
    }
  },
  component: AuditLogsPage,
});

function AuditLogsPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Committee"
      title="Audit log"
      description="Review admin actions across tournaments and committee tools."
    />
  );
}
