import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/app/_authed/tournaments/$tournamentId/",
)({
  component: TournamentOverviewPage,
});

function TournamentOverviewPage() {
  const { tournamentId } = Route.useParams();

  return (
    <AdminPlaceholderPage
      title="Tournament overview"
      description={`Workspace for tournament ${tournamentId}. Overview, status, and shortcuts will land here.`}
    />
  );
}
