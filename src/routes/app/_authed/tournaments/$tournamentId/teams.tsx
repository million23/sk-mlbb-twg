import { TeamsPage } from "@/components/admin/teams/teams-page";
import { useTournamentParticipants } from "@/hooks/admin/use-tournament-participants";
import {
  teamMutationErrorMessage,
  useArchivedTournamentTeams,
  useTeamMutations,
  useTournamentTeams,
} from "@/hooks/admin/use-tournament-teams";
import { useTournaments } from "@/hooks/legacy/use-tournaments";
import { tournamentLabel } from "@/lib/legacy/tournament-label";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/app/_authed/tournaments/$tournamentId/teams",
)({
  component: TournamentTeamsPage,
});

function TournamentTeamsPage() {
  const { tournamentId } = Route.useParams();
  const teamsQuery = useTournamentTeams(tournamentId);
  const archivedQuery = useArchivedTournamentTeams(tournamentId);
  const participantsQuery = useTournamentParticipants(tournamentId);
  const tournamentsQuery = useTournaments();
  const mutations = useTeamMutations(tournamentId);

  const tournament = tournamentsQuery.data?.find((t) => t.id === tournamentId);
  const tournamentTitle = tournament
    ? tournamentLabel(tournament as Parameters<typeof tournamentLabel>[0])
    : undefined;

  const minReady = useMemo(() => {
    const t = tournament as
      | { min_team_size?: number; minTeamSize?: number }
      | undefined;
    const n = t?.min_team_size ?? t?.minTeamSize ?? 5;
    return Number.isFinite(n) && n > 0 ? Number(n) : 5;
  }, [tournament]);

  const maxTeamSize = useMemo(() => {
    const t = tournament as
      | { max_team_size?: number; maxTeamSize?: number }
      | undefined;
    const n = t?.max_team_size ?? t?.maxTeamSize ?? 6;
    return Number.isFinite(n) && n > 0 ? Number(n) : 6;
  }, [tournament]);

  const teams = teamsQuery.data ?? [];
  const participants = participantsQuery.data ?? [];

  const membersByTeamId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of participants) {
      if (!p.team || !p.id) continue;
      const list = map.get(p.team) ?? [];
      list.push(p.id);
      map.set(p.team, list);
    }
    return map;
  }, [participants]);

  const syncStatuses = mutations.syncStatuses;
  const syncedKey = useRef("");
  useEffect(() => {
    if (!teamsQuery.isSuccess || !participantsQuery.isSuccess) return;
    if (teams.length === 0) return;
    const key = `${minReady}|${teams
      .map(
        (t) =>
          `${t.id}:${t.status}:${t.captain ?? ""}:${(membersByTeamId.get(t.id ?? "") ?? []).join(",")}`,
      )
      .join("|")}`;
    if (key === syncedKey.current) return;
    syncedKey.current = key;
    void syncStatuses.mutateAsync({
      teams,
      membersByTeamId,
      minReady,
    });
  }, [
    teams,
    membersByTeamId,
    minReady,
    teamsQuery.isSuccess,
    participantsQuery.isSuccess,
    syncStatuses,
  ]);

  const isLoading =
    teamsQuery.isLoading ||
    participantsQuery.isLoading ||
    archivedQuery.isLoading;
  const isError =
    teamsQuery.isError ||
    participantsQuery.isError ||
    archivedQuery.isError;

  return (
    <TeamsPage
      tournamentTitle={tournamentTitle}
      teams={teams}
      archivedTeams={archivedQuery.data ?? []}
      participants={participants}
      minReady={minReady}
      maxTeamSize={maxTeamSize}
      isLoading={isLoading}
      isError={isError}
      errorMessage={
        teamsQuery.error instanceof Error
          ? teamsQuery.error.message
          : participantsQuery.error instanceof Error
            ? participantsQuery.error.message
            : undefined
      }
      onRetry={() => {
        void teamsQuery.refetch();
        void archivedQuery.refetch();
        void participantsQuery.refetch();
      }}
      formPending={mutations.create.isPending || mutations.update.isPending}
      quickPending={
        mutations.create.isPending || mutations.assignMembers.isPending
      }
      assignPending={mutations.assignMembers.isPending}
      archivePending={mutations.archive.isPending}
      removePending={mutations.removeMember.isPending}
      restorePending={mutations.restore.isPending}
      onCreateTeam={async (values) => {
        try {
          await mutations.create.mutateAsync({
            name: values.name,
            status: "forming",
          });
          toast.success("Team added");
        } catch (err) {
          toast.error(teamMutationErrorMessage(err));
          throw err;
        }
      }}
      onUpdateTeam={async (id, values) => {
        try {
          await mutations.update.mutateAsync({
            id,
            values: {
              name: values.name,
              captain: values.captain,
              status: values.status,
            },
          });
          toast.success("Team updated");
        } catch (err) {
          toast.error(teamMutationErrorMessage(err));
          throw err;
        }
      }}
      onQuickCreate={async ({ name, captain, participantIds }) => {
        try {
          const created = await mutations.create.mutateAsync({
            name,
            captain,
            status: "forming",
          });
          if (!created.id) throw new Error("Team was created without an id");
          await mutations.assignMembers.mutateAsync({
            teamId: created.id,
            participantIds,
            currentStatus: "forming",
            captainId: captain || undefined,
            existingMemberIds: [],
            minReady,
          });
          toast.success(
            participantIds.length >= minReady
              ? `Team "${name}" created with ${participantIds.length} members (Ready).`
              : `Team "${name}" created with ${participantIds.length} member(s).`,
          );
        } catch (err) {
          toast.error(teamMutationErrorMessage(err));
          throw err;
        }
      }}
      onAssignMembers={async (teamId, participantIds) => {
        const team = teams.find((t) => t.id === teamId);
        const existing = membersByTeamId.get(teamId) ?? [];
        try {
          await mutations.assignMembers.mutateAsync({
            teamId,
            participantIds,
            currentStatus: team?.status,
            captainId: team?.captain,
            existingMemberIds: existing,
            minReady,
          });
          const next = existing.length + participantIds.length;
          toast.success(
            next >= minReady
              ? "Members added. Team status set to Ready."
              : "Members added to team",
          );
        } catch (err) {
          toast.error(teamMutationErrorMessage(err));
          throw err;
        }
      }}
      onRemoveMember={async (teamId, participantId) => {
        const team = teams.find((t) => t.id === teamId);
        const remaining = (membersByTeamId.get(teamId) ?? []).filter(
          (id) => id !== participantId,
        );
        try {
          await mutations.removeMember.mutateAsync({
            teamId,
            participantId,
            currentStatus: team?.status,
            captainId: team?.captain,
            remainingMemberIds: remaining,
            minReady,
          });
          toast.success("Member removed from team");
        } catch (err) {
          toast.error(teamMutationErrorMessage(err));
          throw err;
        }
      }}
      onArchive={async (teamId) => {
        try {
          await mutations.archive.mutateAsync(teamId);
          toast.success("Team archived");
        } catch (err) {
          toast.error(teamMutationErrorMessage(err));
          throw err;
        }
      }}
      onRestore={async (teamId) => {
        try {
          await mutations.restore.mutateAsync(teamId);
          toast.success("Team restored");
        } catch (err) {
          toast.error(teamMutationErrorMessage(err));
          throw err;
        }
      }}
    />
  );
}
