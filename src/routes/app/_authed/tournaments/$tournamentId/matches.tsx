import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/app/_authed/tournaments/$tournamentId/matches",
)({
  component: TournamentMatchesPage,
});

function TournamentMatchesPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Tournament workspace"
      title="Matches"
      description="Bracket and match results for this tournament."
    />
  );
}
