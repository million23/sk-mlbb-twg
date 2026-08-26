import { adminParticipantKeys } from "@/hooks/admin/participant-query-keys";
import { adminTeamKeys } from "@/hooks/admin/team-query-keys";
import {
  getCollectionsParticipantsRecords,
  patchCollectionsParticipantsRecordsId,
} from "@/hooks/orval/participants-collection/participants-collection";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type { TeamsRecord } from "@/hooks/orval/model/teamsRecord";
import type { TeamsRecordStatus } from "@/hooks/orval/model/teamsRecordStatus";
import {
  getCollectionsTeamsRecords,
  patchCollectionsTeamsRecordsId,
  postCollectionsTeamsRecords,
} from "@/hooks/orval/teams-collection/teams-collection";
import type { PlannedOpenTeam } from "@/lib/admin/auto-open-teams";
import {
  nextTeamRosterPatch,
  resolveTeamStatus,
} from "@/lib/admin/team-roster-meta";
import {
  assertPermission,
  canManageTeams,
  type AdminAuthRecord,
} from "@/lib/admin/permissions";
import { ApiError } from "@/lib/api/mutator/custom-instance";
import { getAuthRecordId } from "@/lib/legacy/mutation-authors";
import { pb } from "@/lib/pocketbase";
import { registrationKeys } from "@/hooks/registration/query-keys";
import {
  registrationApiErrorMessage,
  unwrapOrvalListItems,
  unwrapOrvalRecord,
} from "@/lib/registration/orval";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

function assertCanManageTeams() {
  assertPermission(
    canManageTeams(pb.authStore.record as AdminAuthRecord),
    "You do not have permission to manage teams.",
  );
}

export type TeamFormValues = {
  name: string;
  captain: string;
  status: TeamsRecordStatus;
};

function withAuditCreate(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const uid = getAuthRecordId();
  if (!uid) return data;
  return { ...data, created_by: uid, updated_by: uid };
}

function withAuditUpdate(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const uid = getAuthRecordId();
  if (!uid) return data;
  return { ...data, updated_by: uid };
}

export { resolveTeamStatus };

export function tournamentTeamsQueryOptions(tournamentId: string) {
  return queryOptions({
    queryKey: adminTeamKeys.list(tournamentId),
    queryFn: async () => {
      const res = await getCollectionsTeamsRecords({
        page: 1,
        perPage: 500,
        sort: "-created",
        filter: `tournament = "${tournamentId}" && archived != true`,
        expand: "captain",
      });
      return unwrapOrvalListItems<TeamsRecord>(res);
    },
    enabled: Boolean(tournamentId),
  });
}

export function tournamentArchivedTeamsQueryOptions(tournamentId: string) {
  return queryOptions({
    queryKey: adminTeamKeys.archived(tournamentId),
    queryFn: async () => {
      const res = await getCollectionsTeamsRecords({
        page: 1,
        perPage: 500,
        sort: "-updated",
        filter: `tournament = "${tournamentId}" && archived = true`,
        expand: "captain",
      });
      return unwrapOrvalListItems<TeamsRecord>(res);
    },
    enabled: Boolean(tournamentId),
  });
}

export function useTournamentTeams(tournamentId: string) {
  return useQuery(tournamentTeamsQueryOptions(tournamentId));
}

export function useArchivedTournamentTeams(tournamentId: string) {
  return useQuery(tournamentArchivedTeamsQueryOptions(tournamentId));
}

export function useTeamMutations(tournamentId: string) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: adminTeamKeys.list(tournamentId),
      }),
      queryClient.invalidateQueries({
        queryKey: adminTeamKeys.archived(tournamentId),
      }),
      queryClient.invalidateQueries({
        queryKey: adminParticipantKeys.list(tournamentId),
      }),
      queryClient.invalidateQueries({
        queryKey: registrationKeys.listedTeams(tournamentId),
      }),
    ]);
  };

  const patchTeam = async (
    id: string,
    fields: Record<string, unknown>,
  ): Promise<TeamsRecord> => {
    const res = await patchCollectionsTeamsRecordsId(
      id,
      withAuditUpdate(fields) as unknown as TeamsRecord,
    );
    return unwrapOrvalRecord<TeamsRecord>(res);
  };

  const patchParticipant = async (
    id: string,
    fields: Record<string, unknown>,
  ): Promise<ParticipantsRecord> => {
    const res = await patchCollectionsParticipantsRecordsId(
      id,
      withAuditUpdate(fields) as unknown as ParticipantsRecord,
    );
    return unwrapOrvalRecord<ParticipantsRecord>(res);
  };

  const syncTeamRosterMeta = async ({
    teamId,
    memberCount,
    currentStatus,
    captainId,
    memberIds,
    minReady = 5,
  }: {
    teamId: string;
    memberCount: number;
    currentStatus?: TeamsRecordStatus;
    captainId?: string;
    memberIds: string[];
    minReady?: number;
  }): Promise<boolean> => {
    const patch = nextTeamRosterPatch({
      memberCount,
      currentStatus,
      captainId,
      memberIds,
      minReady,
    });
    if (!patch) return false;
    await patchTeam(teamId, patch);
    return true;
  };

  const create = useMutation({
    mutationFn: async (values: {
      name: string;
      captain?: string;
      status?: TeamsRecordStatus;
    }) => {
      assertCanManageTeams();
      // Omit empty optional relations — PocketBase rejects `captain: ""` on create
      // ("Cannot be blank" / values should not be empty) even when the field is optional.
      const captain = values.captain?.trim();
      const res = await postCollectionsTeamsRecords(
        withAuditCreate({
          tournament: tournamentId,
          name: values.name.trim(),
          status: values.status ?? "forming",
          archived: false,
          ...(captain ? { captain } : {}),
        }) as unknown as TeamsRecord,
      );
      return unwrapOrvalRecord<TeamsRecord>(res);
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Partial<TeamFormValues> & {
        status?: TeamsRecordStatus;
        captain?: string | null;
      };
    }) => {
      assertCanManageTeams();
      const fields: Record<string, unknown> = {};
      if (values.name != null) fields.name = values.name.trim();
      if (values.status != null) fields.status = values.status;
      if (values.captain !== undefined) {
        fields.captain = values.captain?.trim() || "";
      }
      return patchTeam(id, fields);
    },
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      assertCanManageTeams();
      const membersRes = await getCollectionsParticipantsRecords({
        page: 1,
        perPage: 500,
        filter: `team = "${id}" && archived != true`,
      });
      const members = unwrapOrvalListItems<ParticipantsRecord>(membersRes);
      for (const p of members) {
        if (!p.id) continue;
        await patchParticipant(p.id, {
          team: "",
          status: "unassigned",
        });
      }
      return patchTeam(id, { archived: true });
    },
    onSuccess: invalidate,
  });

  const restore = useMutation({
    mutationFn: async (id: string) => {
      assertCanManageTeams();
      return patchTeam(id, { archived: false });
    },
    onSuccess: invalidate,
  });

  const assignMembers = useMutation({
    mutationFn: async ({
      teamId,
      participantIds,
      currentStatus,
      captainId,
      existingMemberIds,
      minReady = 5,
    }: {
      teamId: string;
      participantIds: string[];
      currentStatus?: TeamsRecordStatus;
      captainId?: string;
      existingMemberIds: string[];
      minReady?: number;
    }) => {
      assertCanManageTeams();
      for (const pid of participantIds) {
        await patchParticipant(pid, {
          team: teamId,
          status: "assigned",
        });
      }
      const memberIds = [
        ...new Set([...existingMemberIds, ...participantIds]),
      ];
      await syncTeamRosterMeta({
        teamId,
        memberCount: memberIds.length,
        currentStatus,
        captainId,
        memberIds,
        minReady,
      });
      return { teamId, memberIds };
    },
    onSuccess: invalidate,
  });

  const removeMember = useMutation({
    mutationFn: async ({
      teamId,
      participantId,
      currentStatus,
      captainId,
      remainingMemberIds,
      minReady = 5,
    }: {
      teamId: string;
      participantId: string;
      currentStatus?: TeamsRecordStatus;
      captainId?: string;
      remainingMemberIds: string[];
      minReady?: number;
    }) => {
      assertCanManageTeams();
      await patchParticipant(participantId, {
        team: "",
        status: "unassigned",
      });
      await syncTeamRosterMeta({
        teamId,
        memberCount: remainingMemberIds.length,
        currentStatus,
        captainId,
        memberIds: remainingMemberIds,
        minReady,
      });
    },
    onSuccess: invalidate,
  });

  const syncStatuses = useMutation({
    mutationFn: async ({
      teams,
      membersByTeamId,
      minReady = 5,
    }: {
      teams: TeamsRecord[];
      membersByTeamId: Map<string, string[]>;
      minReady?: number;
    }) => {
      assertCanManageTeams();
      let changed = 0;
      for (const team of teams) {
        if (!team.id || team.status === "inactive") continue;
        const memberIds = membersByTeamId.get(team.id) ?? [];
        const didChange = await syncTeamRosterMeta({
          teamId: team.id,
          memberCount: memberIds.length,
          currentStatus: team.status,
          captainId: team.captain,
          memberIds,
          minReady,
        });
        if (didChange) changed += 1;
      }
      return changed;
    },
    onSuccess: (changed) => {
      if (changed > 0) void invalidate();
    },
  });

  /** Create planned open-matching teams and assign members. */
  const autoOpenTeams = useMutation({
    mutationFn: async ({
      teams,
      minReady = 5,
    }: {
      teams: PlannedOpenTeam[];
      minReady?: number;
    }) => {
      assertCanManageTeams();
      const created: { teamId: string; name: string; memberCount: number }[] =
        [];
      for (const planned of teams) {
        const captain = planned.captainId?.trim() || planned.memberIds[0];
        const res = await postCollectionsTeamsRecords(
          withAuditCreate({
            tournament: tournamentId,
            name: planned.name.trim(),
            status: "forming",
            archived: false,
            ...(captain ? { captain } : {}),
          }) as unknown as TeamsRecord,
        );
        const team = unwrapOrvalRecord<TeamsRecord>(res);
        if (!team.id) throw new Error("Team was created without an id");
        for (const pid of planned.memberIds) {
          await patchParticipant(pid, {
            team: team.id,
            status: "assigned",
          });
        }
        await syncTeamRosterMeta({
          teamId: team.id,
          memberCount: planned.memberIds.length,
          currentStatus: "forming",
          captainId: captain,
          memberIds: planned.memberIds,
          minReady,
        });
        created.push({
          teamId: team.id,
          name: planned.name,
          memberCount: planned.memberIds.length,
        });
      }
      return created;
    },
    onSuccess: invalidate,
  });

  return {
    create,
    update,
    archive,
    restore,
    assignMembers,
    removeMember,
    syncStatuses,
    autoOpenTeams,
  };
}

export function teamMutationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const data = error.data;
    if (data && typeof data === "object") {
      const envelope = data as {
        message?: string;
        data?: Record<string, { message?: string; code?: string }>;
      };
      if (envelope.data && typeof envelope.data === "object") {
        const entry = Object.entries(envelope.data).find(
          ([, v]) => v?.message,
        );
        if (entry) {
          const [field, detail] = entry;
          return `${field}: ${detail?.message}`;
        }
      }
    }
    return registrationApiErrorMessage(error);
  }
  if (error instanceof Error) return error.message;
  return "Request failed";
}
