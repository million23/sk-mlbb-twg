import { TeamStandingPage } from "@/components/admin/team-standing/team-standing-page";
import { useTournamentTeams } from "@/hooks/admin/use-tournament-teams";
import { useMatchesForTournament } from "@/hooks/legacy/use-matches";
import { useTournaments } from "@/hooks/legacy/use-tournaments";
import { tournamentLabel } from "@/lib/legacy/tournament-label";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/app/_authed/tournaments/$tournamentId/team-standing",
)({
  component: TournamentTeamStandingPage,
});

function TournamentTeamStandingPage() {
  const { tournamentId } = Route.useParams();
  const teamsQuery = useTournamentTeams(tournamentId);
  const matchesQuery = useMatchesForTournament(tournamentId);
  const tournamentsQuery = useTournaments();

  const tournament = tournamentsQuery.data?.find((t) => t.id === tournamentId);
  const tournamentTitle = tournament
    ? tournamentLabel(tournament as Parameters<typeof tournamentLabel>[0])
    : undefined;

  const isLoading = teamsQuery.isLoading || matchesQuery.isLoading;
  const isError = teamsQuery.isError || matchesQuery.isError;

  return (
    <TeamStandingPage
      tournamentTitle={tournamentTitle}
      teams={teamsQuery.data ?? []}
      matches={matchesQuery.data ?? []}
      isLoading={isLoading}
      isError={isError}
      errorMessage={
        teamsQuery.error instanceof Error
          ? teamsQuery.error.message
          : matchesQuery.error instanceof Error
            ? matchesQuery.error.message
            : undefined
      }
      onRetry={() => {
        void teamsQuery.refetch();
        void matchesQuery.refetch();
      }}
    />
  );
}
