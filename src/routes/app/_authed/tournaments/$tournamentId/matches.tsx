import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/app/_authed/tournaments/$tournamentId/matches",
)({
  component: TournamentMatchesPage,
});

function TournamentMatchesPage() {
  const { tournamentId } = Route.useParams();

  return (
    <AdminPlaceholderPage
      title="Matches"
      description={`Match schedule and results for tournament ${tournamentId}.`}
    />
  );
}
