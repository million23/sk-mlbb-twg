import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/_authed/admins")({
  component: AdminsPage,
});

function AdminsPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Committee"
      title="Admins"
      description="Manage committee accounts and access for this platform."
    />
  );
}
