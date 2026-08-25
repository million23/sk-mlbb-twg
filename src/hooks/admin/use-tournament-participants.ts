import {
  deleteCollectionsParticipantsRecordsId,
  getCollectionsParticipantsRecords,
  getPatchCollectionsParticipantsRecordsIdUrl,
  getPostCollectionsParticipantsRecordsUrl,
  patchCollectionsParticipantsRecordsId,
} from "@/hooks/orval/participants-collection/participants-collection";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import { adminParticipantKeys } from "@/hooks/admin/participant-query-keys";
import { adminTeamKeys } from "@/hooks/admin/team-query-keys";
import {
  assertPermission,
  canManageParticipants,
  type AdminAuthRecord,
} from "@/lib/admin/permissions";
import {
  ensureCreateTeamAfterApprove,
  ensureJoinTeamAfterApprove,
  maybeArchiveEmptyCreateTeam,
} from "@/lib/admin/ensure-create-team";
import { PARTICIPANT_DOC_FIELDS } from "@/lib/admin/participant-files";
import {
  participantListFilter,
  type ParticipantListStatusTab,
} from "@/lib/admin/participant-list-query";
import { ApiError, customInstance } from "@/lib/api/mutator/custom-instance";
import { getAuthRecordId } from "@/lib/legacy/mutation-authors";
import { toPocketBaseDateTime } from "@/lib/legacy/registered-date";
import { pb } from "@/lib/pocketbase";
import {
  registrationApiErrorMessage,
  unwrapOrvalListItems,
  unwrapOrvalListPage,
  unwrapOrvalRecord,
} from "@/lib/registration/orval";
import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

function assertCanManageParticipants() {
  assertPermission(
    canManageParticipants(pb.authStore.record as AdminAuthRecord),
    "You do not have permission to manage participants.",
  );
}

export type ParticipantFormValues = {
  name: string;
  email: string;
  ign: string;
  birthdate: string;
  contact_number: string;
  user_id: string;
  server_id: string;
  address_phase: "4" | "9" | "10";
  address_package: string;
  address_block: string;
  address_lot: string;
  preferred_lane: ("mid" | "gold" | "exp" | "support" | "jungle")[];
  team_intent: "open_matching" | "join_team" | "create_team";
  preferred_team: string;
  preferred_team_name: string;
  registration_status: "pending" | "approved" | "rejected";
  registration_reject_reason: string;
};

export type ParticipantDocUploads = Partial<
  Record<(typeof PARTICIPANT_DOC_FIELDS)[number], File | null>
>;

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

function appendFormFields(
  form: FormData,
  fields: Record<string, unknown>,
) {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "boolean") {
      form.append(key, value ? "true" : "false");
      continue;
    }
    // PocketBase multi-select: repeat the key (not a JSON string).
    if (Array.isArray(value)) {
      for (const item of value) {
        form.append(key, String(item));
      }
      continue;
    }
    form.append(key, String(value));
  }
}

function hasUploads(uploads?: ParticipantDocUploads): boolean {
  if (!uploads) return false;
  return PARTICIPANT_DOC_FIELDS.some((k) => {
    const f = uploads[k];
    return f instanceof File && f.size > 0;
  });
}

function appendUploads(form: FormData, uploads?: ParticipantDocUploads) {
  if (!uploads) return;
  for (const key of PARTICIPANT_DOC_FIELDS) {
    const file = uploads[key];
    if (file instanceof File && file.size > 0) {
      form.append(key, file, file.name);
    }
  }
}

export const PARTICIPANT_LIST_PAGE_SIZE = 40;

async function fetchParticipantListPage(params: {
  tournamentId: string;
  tab: ParticipantListStatusTab;
  search: string;
  page: number;
  perPage: number;
  expand?: boolean;
}) {
  const res = await getCollectionsParticipantsRecords({
    page: params.page,
    perPage: params.perPage,
    sort: "-created",
    filter: participantListFilter(
      params.tournamentId,
      params.tab,
      params.search,
    ),
    ...(params.expand ? { expand: "preferred_team,team" } : {}),
  });
  return unwrapOrvalListPage<ParticipantsRecord>(res);
}

export function tournamentParticipantsQueryOptions(tournamentId: string) {
  return queryOptions({
    queryKey: adminParticipantKeys.list(tournamentId),
    queryFn: async () => {
      const res = await getCollectionsParticipantsRecords({
        page: 1,
        perPage: 500,
        sort: "-created",
        filter: `tournament = "${tournamentId}" && archived != true`,
        expand: "preferred_team,team",
      });
      return unwrapOrvalListItems<ParticipantsRecord>(res);
    },
    enabled: Boolean(tournamentId),
  });
}

export function tournamentParticipantsInfiniteQueryOptions(
  tournamentId: string,
  tab: ParticipantListStatusTab,
  search: string,
) {
  return infiniteQueryOptions({
    queryKey: adminParticipantKeys.infinite(tournamentId, tab, search),
    queryFn: ({ pageParam }) =>
      fetchParticipantListPage({
        tournamentId,
        tab,
        search,
        page: pageParam,
        perPage: PARTICIPANT_LIST_PAGE_SIZE,
        expand: true,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: Boolean(tournamentId),
  });
}

export function tournamentParticipantCountsQueryOptions(tournamentId: string) {
  return queryOptions({
    queryKey: adminParticipantKeys.counts(tournamentId),
    queryFn: async () => {
      const tabs = ["all", "pending", "approved", "rejected"] as const;
      const pages = await Promise.all(
        tabs.map((tab) =>
          fetchParticipantListPage({
            tournamentId,
            tab,
            search: "",
            page: 1,
            perPage: 1,
          }),
        ),
      );
      return {
        all: pages[0].totalItems,
        pending: pages[1].totalItems,
        approved: pages[2].totalItems,
        rejected: pages[3].totalItems,
      };
    },
    enabled: Boolean(tournamentId),
  });
}

export function useTournamentParticipants(tournamentId: string) {
  return useQuery(tournamentParticipantsQueryOptions(tournamentId));
}

export function useTournamentParticipantsInfinite(
  tournamentId: string,
  tab: ParticipantListStatusTab,
  search: string,
) {
  return useInfiniteQuery(
    tournamentParticipantsInfiniteQueryOptions(tournamentId, tab, search),
  );
}

export function useTournamentParticipantCounts(tournamentId: string) {
  return useQuery(tournamentParticipantCountsQueryOptions(tournamentId));
}

export async function fetchAllTournamentParticipants(
  tournamentId: string,
): Promise<ParticipantsRecord[]> {
  const items: ParticipantsRecord[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const result = await fetchParticipantListPage({
      tournamentId,
      tab: "all",
      search: "",
      page,
      perPage: 500,
      expand: true,
    });
    items.push(...result.items);
    totalPages = Math.max(result.totalPages, 1);
    if (result.items.length === 0) break;
    page += 1;
  }
  return items;
}

export function useParticipantMutations(tournamentId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: adminParticipantKeys.list(tournamentId),
    });
    void queryClient.invalidateQueries({
      queryKey: adminTeamKeys.list(tournamentId),
    });
    void queryClient.invalidateQueries({
      queryKey: adminTeamKeys.archived(tournamentId),
    });
  };

  const approve = useMutation({
    mutationFn: async (id: string) => {
      assertCanManageParticipants();
      const res = await patchCollectionsParticipantsRecordsId(
        id,
        withAuditUpdate({
          registration_status: "approved",
          registration_reject_reason: "",
        }) as unknown as ParticipantsRecord,
      );
      const participant = unwrapOrvalRecord<ParticipantsRecord>(res);
      const joinResult = await ensureJoinTeamAfterApprove({
        tournamentId,
        participant,
      });
      const teamResult = await ensureCreateTeamAfterApprove({
        tournamentId,
        participant,
      });
      return { participant, joinResult, teamResult };
    },
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      assertCanManageParticipants();
      const res = await patchCollectionsParticipantsRecordsId(
        id,
        withAuditUpdate({
          registration_status: "rejected",
          registration_reject_reason: reason.trim() || "No reason given",
        }) as unknown as ParticipantsRecord,
      );
      const participant = unwrapOrvalRecord<ParticipantsRecord>(res);
      await maybeArchiveEmptyCreateTeam({ tournamentId, participant });
      return participant;
    },
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      assertCanManageParticipants();
      const res = await patchCollectionsParticipantsRecordsId(
        id,
        withAuditUpdate({
          archived: true,
          team: "",
          status: "unassigned",
        }) as unknown as ParticipantsRecord,
      );
      return unwrapOrvalRecord<ParticipantsRecord>(res);
    },
    onSuccess: invalidate,
  });

  const hardDelete = useMutation({
    mutationFn: async (id: string) => {
      assertCanManageParticipants();
      await deleteCollectionsParticipantsRecordsId(id);
      return id;
    },
    onSuccess: invalidate,
  });

  const create = useMutation({
    mutationFn: async ({
      values,
      uploads,
    }: {
      values: ParticipantFormValues;
      uploads?: ParticipantDocUploads;
    }) => {
      assertCanManageParticipants();
      const fields = withAuditCreate({
        tournament: tournamentId,
        name: values.name.trim(),
        email: values.email.trim(),
        ign: values.ign.trim(),
        birthdate: toPocketBaseDateTime(values.birthdate),
        user_id: values.user_id.trim(),
        server_id: values.server_id.trim(),
        address_phase: values.address_phase,
        address_package: values.address_package.trim(),
        address_block: values.address_block.trim(),
        address_lot: values.address_lot.trim(),
        preferred_lane: (values.preferred_lane[0] ?? "mid") as (
          | "mid"
          | "gold"
          | "exp"
          | "support"
          | "jungle"
        ),
        preferred_roles: values.preferred_lane,
        team_intent: values.team_intent,
        ...(values.team_intent === "join_team" && values.preferred_team
          ? { preferred_team: values.preferred_team }
          : {}),
        ...(values.team_intent === "create_team" &&
        values.preferred_team_name.trim()
          ? { preferred_team_name: values.preferred_team_name.trim() }
          : {}),
        registration_status: values.registration_status,
        ...(values.registration_status === "rejected"
          ? {
              registration_reject_reason:
                values.registration_reject_reason.trim() || "No reason given",
            }
          : {}),
        status: "unassigned",
        archived: false,
        ...(values.contact_number.trim()
          ? { contact_number: values.contact_number.trim() }
          : {}),
      });

      if (hasUploads(uploads)) {
        const form = new FormData();
        appendFormFields(form, fields);
        appendUploads(form, uploads);
        const res = await customInstance<unknown>(
          getPostCollectionsParticipantsRecordsUrl(),
          { method: "POST", body: form },
        );
        return unwrapOrvalRecord<ParticipantsRecord>(res);
      }

      const res = await customInstance<unknown>(
        getPostCollectionsParticipantsRecordsUrl(),
        {
          method: "POST",
          body: JSON.stringify(fields),
        },
      );
      return unwrapOrvalRecord<ParticipantsRecord>(res);
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      values,
      uploads,
    }: {
      id: string;
      values: ParticipantFormValues;
      uploads?: ParticipantDocUploads;
    }) => {
      assertCanManageParticipants();
      const fields = withAuditUpdate({
        name: values.name.trim(),
        email: values.email.trim(),
        ign: values.ign.trim(),
        birthdate: toPocketBaseDateTime(values.birthdate),
        user_id: values.user_id.trim(),
        server_id: values.server_id.trim(),
        address_phase: values.address_phase,
        address_package: values.address_package.trim(),
        address_block: values.address_block.trim(),
        address_lot: values.address_lot.trim(),
        preferred_lane: (values.preferred_lane[0] ?? "mid") as (
          | "mid"
          | "gold"
          | "exp"
          | "support"
          | "jungle"
        ),
        preferred_roles: values.preferred_lane,
        team_intent: values.team_intent,
        // Clear relation when leaving join_team (PocketBase accepts "").
        preferred_team:
          values.team_intent === "join_team" ? values.preferred_team : "",
        preferred_team_name:
          values.team_intent === "create_team"
            ? values.preferred_team_name.trim()
            : "",
        registration_status: values.registration_status,
        registration_reject_reason:
          values.registration_status === "rejected"
            ? values.registration_reject_reason.trim() || "No reason given"
            : "",
        contact_number: values.contact_number.trim(),
      });

      if (hasUploads(uploads)) {
        const form = new FormData();
        appendFormFields(form, fields);
        appendUploads(form, uploads);
        const res = await customInstance<unknown>(
          getPatchCollectionsParticipantsRecordsIdUrl(id),
          { method: "PATCH", body: form },
        );
        return unwrapOrvalRecord<ParticipantsRecord>(res);
      }

      const res = await patchCollectionsParticipantsRecordsId(
        id,
        fields as unknown as ParticipantsRecord,
      );
      return unwrapOrvalRecord<ParticipantsRecord>(res);
    },
    onSuccess: invalidate,
  });

  const formCreateTeam = useMutation({
    mutationFn: async (participant: ParticipantsRecord) => {
      assertCanManageParticipants();
      return ensureCreateTeamAfterApprove({
        tournamentId,
        participant,
      });
    },
    onSuccess: invalidate,
  });

  const formJoinTeam = useMutation({
    mutationFn: async (participant: ParticipantsRecord) => {
      assertCanManageParticipants();
      return ensureJoinTeamAfterApprove({
        tournamentId,
        participant,
      });
    },
    onSuccess: invalidate,
  });

  return {
    approve,
    reject,
    archive,
    hardDelete,
    create,
    update,
    formCreateTeam,
    formJoinTeam,
  };
}

export function participantMutationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return registrationApiErrorMessage(error);
  if (error instanceof Error) return error.message;
  return "Request failed";
}
