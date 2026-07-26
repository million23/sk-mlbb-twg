import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/app/_authed/tournaments/$tournamentId/participants",
)({
  component: TournamentParticipantsPage,
});

function TournamentParticipantsPage() {
  const { tournamentId } = Route.useParams();

  return (
    <AdminPlaceholderPage
      title="Participants"
      description={`Registrants and participants for tournament ${tournamentId}.`}
    />
  );
}
