import { TournamentMatchesPage, type TournamentDeskTab } from "@/components/landing/tournament-matches-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tournaments/$id")({
  validateSearch: (search: Record<string, unknown>): { tab: TournamentDeskTab } => ({
    tab: search.tab === "teams" ? "teams" : "matchups",
  }),
  component: TournamentMatchesRoute,
});

function TournamentMatchesRoute() {
  const { id } = Route.useParams();
  const { tab } = Route.useSearch();
  return <TournamentMatchesPage id={id} tab={tab} />;
}
