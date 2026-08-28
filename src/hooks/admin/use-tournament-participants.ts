import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import { adminParticipantKeys } from "@/hooks/admin/participant-query-keys";
import { adminTeamKeys } from "@/hooks/admin/team-query-keys";
import {
  assertPermission,
  canManageParticipants,
} from "@/lib/admin/permissions";
import {
  ensureCreateTeamAfterApprove,
  ensureJoinTeamAfterApprove,
  maybeArchiveEmptyCreateTeam,
} from "@/lib/admin/ensure-create-team";
import { PARTICIPANT_DOC_FIELDS } from "@/lib/admin/participant-files";
import {
  participantSearchOrFilter,
  type ParticipantListStatusTab,
} from "@/lib/admin/participant-list-query";
import { getAuthRecordId } from "@/lib/legacy/mutation-authors";
import { calendarDayFromPbDate } from "@/lib/legacy/registered-date";
import { getCommitteeAdminRecord } from "@/lib/supabase/committee-auth";
import { supabase } from "@/lib/supabase/client";
import { emptyToNull, throwIfError } from "@/lib/supabase/errors";
import {
  PARTICIPANT_EMBED,
  mapParticipantRow,
} from "@/lib/supabase/map-records";
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
    canManageParticipants(getCommitteeAdminRecord()),
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

function hasUploads(uploads?: ParticipantDocUploads): boolean {
  if (!uploads) return false;
  return PARTICIPANT_DOC_FIELDS.some((k) => {
    const f = uploads[k];
    return f instanceof File && f.size > 0;
  });
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
  const select = params.expand ? PARTICIPANT_EMBED : "*";
  let query = supabase
    .from("participants")
    .select(select, { count: "exact" })
    .eq("tournament", params.tournamentId);

  if (params.tab === "archived") query = query.eq("archived", true);
  else query = query.eq("archived", false);

  if (params.tab !== "all" && params.tab !== "archived") {
    query = query.eq("registration_status", params.tab);
  }

  const searchOr = participantSearchOrFilter(params.search);
  if (searchOr) query = query.or(searchOr);

  const from = (params.page - 1) * params.perPage;
  const { data, error, count } = await query
    .order("created", { ascending: false })
    .range(from, from + params.perPage - 1);

  throwIfError({ data, error });
  const items = (data ?? []).map((row) =>
    mapParticipantRow(row as Record<string, unknown>),
  );
  const totalItems = count ?? items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / params.perPage) || 0);
  return {
    items,
    page: params.page,
    totalPages: totalItems === 0 ? 0 : totalPages,
    totalItems,
  };
}

export function tournamentParticipantsQueryOptions(tournamentId: string) {
  return queryOptions({
    queryKey: adminParticipantKeys.list(tournamentId),
    queryFn: async () => {
      const data = throwIfError(
        await supabase
          .from("participants")
          .select(PARTICIPANT_EMBED)
          .eq("tournament", tournamentId)
          .eq("archived", false)
          .order("created", { ascending: false }),
      );
      return (data ?? []).map((row) =>
        mapParticipantRow(row as Record<string, unknown>),
      );
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
      const tabs = [
        "all",
        "pending",
        "approved",
        "rejected",
        "archived",
      ] as const;
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
        archived: pages[4].totalItems,
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
      const participant = mapParticipantRow(
        throwIfError(
          await supabase
            .from("participants")
            .update(
              withAuditUpdate({
                registration_status: "approved",
                registration_reject_reason: null,
              }) as never,
            )
            .eq("id", id)
            .select(PARTICIPANT_EMBED)
            .single(),
        ) as Record<string, unknown>,
      );
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
      const participant = mapParticipantRow(
        throwIfError(
          await supabase
            .from("participants")
            .update(
              withAuditUpdate({
                registration_status: "rejected",
                registration_reject_reason: reason.trim() || "No reason given",
              }) as never,
            )
            .eq("id", id)
            .select(PARTICIPANT_EMBED)
            .single(),
        ) as Record<string, unknown>,
      );
      await maybeArchiveEmptyCreateTeam({ tournamentId, participant });
      return participant;
    },
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      assertCanManageParticipants();
      return mapParticipantRow(
        throwIfError(
          await supabase
            .from("participants")
            .update(
              withAuditUpdate({
                archived: true,
                team: null,
                status: "unassigned",
              }) as never,
            )
            .eq("id", id)
            .select(PARTICIPANT_EMBED)
            .single(),
        ) as Record<string, unknown>,
      );
    },
    onSuccess: invalidate,
  });

  const restore = useMutation({
    mutationFn: async (id: string) => {
      assertCanManageParticipants();
      return mapParticipantRow(
        throwIfError(
          await supabase
            .from("participants")
            .update(withAuditUpdate({ archived: false }) as never)
            .eq("id", id)
            .select(PARTICIPANT_EMBED)
            .single(),
        ) as Record<string, unknown>,
      );
    },
    onSuccess: invalidate,
  });

  const hardDelete = useMutation({
    mutationFn: async (id: string) => {
      assertCanManageParticipants();
      throwIfError(await supabase.from("participants").delete().eq("id", id));
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
      if (hasUploads(uploads)) {
        throw new Error(
          "ID document upload is not wired to Storage yet. Save the registrant without files for now.",
        );
      }
      const lanes = values.preferred_lane;
      const fields = withAuditCreate({
        tournament: tournamentId,
        name: values.name.trim(),
        email: values.email.trim(),
        ign: values.ign.trim(),
        birthdate: calendarDayFromPbDate(values.birthdate) || values.birthdate,
        user_id: values.user_id.trim(),
        server_id: values.server_id.trim(),
        address_phase: values.address_phase,
        address_package: values.address_package.trim(),
        address_block: values.address_block.trim(),
        address_lot: values.address_lot.trim(),
        preferred_lane: lanes,
        preferred_roles: lanes,
        team_intent: values.team_intent,
        preferred_team:
          values.team_intent === "join_team"
            ? emptyToNull(values.preferred_team)
            : null,
        preferred_team_name:
          values.team_intent === "create_team"
            ? values.preferred_team_name.trim() || null
            : null,
        registration_status: values.registration_status,
        registration_reject_reason:
          values.registration_status === "rejected"
            ? values.registration_reject_reason.trim() || "No reason given"
            : null,
        status: "unassigned",
        archived: false,
        contact_number: values.contact_number.trim() || null,
      });

      return mapParticipantRow(
        throwIfError(
          await supabase
            .from("participants")
            .insert(fields as never)
            .select(PARTICIPANT_EMBED)
            .single(),
        ) as Record<string, unknown>,
      );
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
      if (hasUploads(uploads)) {
        throw new Error(
          "ID document upload is not wired to Storage yet. Save the registrant without files for now.",
        );
      }
      const lanes = values.preferred_lane;
      const fields = withAuditUpdate({
        name: values.name.trim(),
        email: values.email.trim(),
        ign: values.ign.trim(),
        birthdate: calendarDayFromPbDate(values.birthdate) || values.birthdate,
        user_id: values.user_id.trim(),
        server_id: values.server_id.trim(),
        address_phase: values.address_phase,
        address_package: values.address_package.trim(),
        address_block: values.address_block.trim(),
        address_lot: values.address_lot.trim(),
        preferred_lane: lanes,
        preferred_roles: lanes,
        team_intent: values.team_intent,
        preferred_team:
          values.team_intent === "join_team"
            ? emptyToNull(values.preferred_team)
            : null,
        preferred_team_name:
          values.team_intent === "create_team"
            ? values.preferred_team_name.trim() || null
            : null,
        registration_status: values.registration_status,
        registration_reject_reason:
          values.registration_status === "rejected"
            ? values.registration_reject_reason.trim() || "No reason given"
            : null,
        contact_number: values.contact_number.trim() || null,
      });

      return mapParticipantRow(
        throwIfError(
          await supabase
            .from("participants")
            .update(fields as never)
            .eq("id", id)
            .select(PARTICIPANT_EMBED)
            .single(),
        ) as Record<string, unknown>,
      );
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
    restore,
    hardDelete,
    create,
    update,
    formCreateTeam,
    formJoinTeam,
  };
}

export function participantMutationErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Request failed";
}
