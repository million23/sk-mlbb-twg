import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/_authed/admins")({
  component: AdminsPage,
});

function AdminsPage() {
  return <AdminPlaceholderPage title="Admins" />;
}
