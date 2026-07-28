import { MatchesPage } from "@/components/admin/matches/matches-page";
import type { MatchFormValues } from "@/components/admin/matches/match-form-dialog";
import type { MatchResultsValues } from "@/components/admin/matches/match-results-dialog";
import { useAdminRbac } from "@/hooks/admin/use-admin-rbac";
import { useTournamentParticipants } from "@/hooks/admin/use-tournament-participants";
import { useTournamentTeams } from "@/hooks/admin/use-tournament-teams";
import { useMatchMutations } from "@/hooks/legacy/use-match-mutations";
import { useMatchesForTournament } from "@/hooks/legacy/use-matches";
import { useTournaments } from "@/hooks/legacy/use-tournaments";
import {
  type AutoMatchPreview,
  autoMatchCreatePayload,
} from "@/lib/admin/auto-matches";
import { tournamentLabel } from "@/lib/legacy/tournament-label";
import { createFileRoute } from "@tanstack/react-router";
import { ClientResponseError } from "pocketbase";
import { useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/app/_authed/tournaments/$tournamentId/matches",
)({
  component: TournamentMatchesPage,
});

function matchMutationErrorMessage(error: unknown): string {
  if (error instanceof ClientResponseError) {
    return (error.response?.message as string) || error.message;
  }
  if (error instanceof Error) return error.message;
  return "Request failed";
}

function TournamentMatchesPage() {
  const { tournamentId } = Route.useParams();
  const { canManageMatches } = useAdminRbac();
  const matchesQuery = useMatchesForTournament(tournamentId);
  const teamsQuery = useTournamentTeams(tournamentId);
  const participantsQuery = useTournamentParticipants(tournamentId);
  const tournamentsQuery = useTournaments();
  const mutations = useMatchMutations();

  const tournament = tournamentsQuery.data?.find((t) => t.id === tournamentId);
  const tournamentTitle = tournament
    ? tournamentLabel(tournament as Parameters<typeof tournamentLabel>[0])
    : undefined;

  const teams = useMemo(
    () =>
      (teamsQuery.data ?? []).flatMap((t) =>
        t.id && t.name ? [{ id: t.id, name: t.name }] : [],
      ),
    [teamsQuery.data],
  );

  const autoMatchTeams = useMemo(
    () =>
      (teamsQuery.data ?? []).flatMap((t) => {
        if (!t.id || !t.name) return [];
        if (t.archived === true || t.status === "inactive") return [];
        return [{ id: t.id, name: t.name }];
      }),
    [teamsQuery.data],
  );

  const defaultBestOf =
    typeof tournament?.match_best_of === "number" && tournament.match_best_of > 0
      ? tournament.match_best_of
      : 3;

  const isLoading =
    matchesQuery.isLoading ||
    teamsQuery.isLoading ||
    participantsQuery.isLoading;
  const isError =
    matchesQuery.isError || teamsQuery.isError || participantsQuery.isError;

  const handleCreate = async (values: MatchFormValues) => {
    try {
      await mutations.create.mutateAsync({
        tournament: tournamentId,
        matchLabel: values.matchLabel || undefined,
        round: values.round || undefined,
        order: values.order,
        bestOf: values.bestOf,
        teamA: values.teamA || undefined,
        teamB: values.teamB || undefined,
        status: "scheduled",
        notes: values.notes || undefined,
      });
      toast.success("Match created");
    } catch (err) {
      toast.error(matchMutationErrorMessage(err));
      throw err;
    }
  };

  const handleUpdate = async (id: string, values: MatchFormValues) => {
    try {
      await mutations.update.mutateAsync({
        id,
        matchLabel: values.matchLabel || undefined,
        round: values.round || undefined,
        order: values.order,
        bestOf: values.bestOf,
        teamA: values.teamA || undefined,
        teamB: values.teamB || undefined,
        status: values.status,
        notes: values.notes || undefined,
      });
      toast.success("Match updated");
    } catch (err) {
      toast.error(matchMutationErrorMessage(err));
      throw err;
    }
  };

  const handleSaveResults = async (
    id: string,
    values: MatchResultsValues,
  ) => {
    try {
      await mutations.update.mutateAsync({
        id,
        scoreA: values.scoreA,
        scoreB: values.scoreB,
        winner: values.winner || undefined,
        status: "completed",
      });
      toast.success("Match result saved");
    } catch (err) {
      toast.error(matchMutationErrorMessage(err));
      throw err;
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await mutations.archive.mutateAsync(id);
      toast.success("Match archived");
    } catch (err) {
      toast.error(matchMutationErrorMessage(err));
      throw err;
    }
  };

  const handleAutoGenerate = async (preview: AutoMatchPreview) => {
    const pairCount = preview.rows.length;
    const leftOutTeam = preview.leftOut;
    try {
      await mutations.createMany.mutateAsync({
        tournamentId,
        matches: autoMatchCreatePayload(preview),
      });
      toast.success(
        leftOutTeam
          ? `Created ${pairCount} matches. ${leftOutTeam.name} has no opponent this round.`
          : `Created ${pairCount} matches.`,
      );
    } catch (err) {
      toast.error(matchMutationErrorMessage(err));
      throw err;
    }
  };

  return (
    <MatchesPage
      tournamentTitle={tournamentTitle}
      canManage={canManageMatches}
      matches={matchesQuery.data ?? []}
      teams={teams}
      autoMatchTeams={autoMatchTeams}
      participants={participantsQuery.data ?? []}
      defaultBestOf={defaultBestOf}
      isLoading={isLoading}
      isError={isError}
      errorMessage={
        matchesQuery.error instanceof Error
          ? matchesQuery.error.message
          : teamsQuery.error instanceof Error
            ? teamsQuery.error.message
            : participantsQuery.error instanceof Error
              ? participantsQuery.error.message
              : undefined
      }
      onRetry={() => {
        void matchesQuery.refetch();
        void teamsQuery.refetch();
        void participantsQuery.refetch();
      }}
      formPending={
        mutations.create.isPending || mutations.update.isPending
      }
      resultsPending={mutations.update.isPending}
      archivePending={mutations.archive.isPending}
      autoMatchPending={mutations.createMany.isPending}
      onCreateMatch={handleCreate}
      onUpdateMatch={handleUpdate}
      onSaveResults={handleSaveResults}
      onArchive={handleArchive}
      onAutoGenerate={handleAutoGenerate}
    />
  );
}
