import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/app/_authed/tournaments/$tournamentId/teams",
)({
  component: TournamentTeamsPage,
});

function TournamentTeamsPage() {
  const { tournamentId } = Route.useParams();

  return (
    <AdminPlaceholderPage
      title="Teams"
      description={`Teams for tournament ${tournamentId}.`}
    />
  );
}
