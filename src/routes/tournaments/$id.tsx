import { TournamentMatchesPage } from "@/components/landing/tournament-matches-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tournaments/$id")({
  component: TournamentMatchesRoute,
});

function TournamentMatchesRoute() {
  const { id } = Route.useParams();
  return <TournamentMatchesPage id={id} />;
}
