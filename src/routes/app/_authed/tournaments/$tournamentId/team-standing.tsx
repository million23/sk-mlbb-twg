import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/app/_authed/tournaments/$tournamentId/team-standing",
)({
  component: TournamentTeamStandingPage,
});

function TournamentTeamStandingPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Tournament workspace"
      title="Team Standing"
      description="Rankings and standings for this tournament."
    />
  );
}
