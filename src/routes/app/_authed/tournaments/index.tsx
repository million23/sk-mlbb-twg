import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/_authed/tournaments/")({
  component: TournamentsListPage,
});

function TournamentsListPage() {
  return (
    <AdminPlaceholderPage
      title="Tournaments"
      description="All events live here. Open one to manage its roster and bracket — multiple tournaments can be active at once."
    />
  );
}
