import { PlayerStatsPage } from "@/components/admin/player-stats/player-stats-page";
import { useTournamentParticipants } from "@/hooks/admin/use-tournament-participants";
import { useTournamentTeams } from "@/hooks/admin/use-tournament-teams";
import { useMatchResultsForTournament } from "@/hooks/legacy/use-match-results";
import { useMatchesForTournament } from "@/hooks/legacy/use-matches";
import { useTournaments } from "@/hooks/legacy/use-tournaments";
import { tournamentLabel } from "@/lib/legacy/tournament-label";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/app/_authed/tournaments/$tournamentId/player-stats",
)({
  component: TournamentPlayerStatsPage,
});

function TournamentPlayerStatsPage() {
  const { tournamentId } = Route.useParams();
  const teamsQuery = useTournamentTeams(tournamentId);
  const matchesQuery = useMatchesForTournament(tournamentId);
  const participantsQuery = useTournamentParticipants(tournamentId);
  const matchResultsQuery = useMatchResultsForTournament(tournamentId);
  const tournamentsQuery = useTournaments();

  const tournament = tournamentsQuery.data?.find((t) => t.id === tournamentId);
  const tournamentTitle = tournament
    ? tournamentLabel(tournament as Parameters<typeof tournamentLabel>[0])
    : undefined;

  const isLoading =
    teamsQuery.isLoading ||
    matchesQuery.isLoading ||
    participantsQuery.isLoading ||
    matchResultsQuery.isLoading;
  const isError =
    teamsQuery.isError ||
    matchesQuery.isError ||
    participantsQuery.isError ||
    matchResultsQuery.isError;

  return (
    <PlayerStatsPage
      tournamentTitle={tournamentTitle}
      teams={teamsQuery.data ?? []}
      matches={matchesQuery.data ?? []}
      matchResults={matchResultsQuery.data ?? []}
      participants={participantsQuery.data ?? []}
      isLoading={isLoading}
      isError={isError}
      errorMessage={
        teamsQuery.error instanceof Error
          ? teamsQuery.error.message
          : matchesQuery.error instanceof Error
            ? matchesQuery.error.message
            : participantsQuery.error instanceof Error
              ? participantsQuery.error.message
              : matchResultsQuery.error instanceof Error
                ? matchResultsQuery.error.message
                : undefined
      }
      onRetry={() => {
        void teamsQuery.refetch();
        void matchesQuery.refetch();
        void participantsQuery.refetch();
        void matchResultsQuery.refetch();
      }}
    />
  );
}
