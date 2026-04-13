import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { withCreatedAuditFields, withUpdatedAuditField } from "@/lib/mutation-authors";
import { pocketbaseListQueryOptions } from "@/lib/pocketbase-list-query-options";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited, rateLimitedWithRetry } from "@/lib/rate-limited-api";
import { queryKeys } from "@/lib/query-keys";
import type { Collections } from "@/types/pocketbase-types";

type TeamInput = Partial<
  Omit<Collections["teams"], "id" | "created" | "updated">
>;
type Team = Collections["teams"];

/** PocketBase filter: not soft-deleted. */
export const TEAMS_ACTIVE_FILTER = "archived != true";

const TEAMS_ARCHIVED_FILTER = "archived = true";

function invalidateTeamQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.teams });
  queryClient.invalidateQueries({ queryKey: queryKeys.teamsArchived });
}

export function useTeams() {
  return useQuery({
    ...pocketbaseListQueryOptions,
    queryKey: queryKeys.teams,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("teams");
        const list = await col.getFullList({
          sort: "-created",
          filter: TEAMS_ACTIVE_FILTER,
        });
        return list as Team[];
      }),
  });
}

export function useArchivedTeams() {
  return useQuery({
    queryKey: queryKeys.teamsArchived,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("teams");
        const list = await col.getFullList({
          sort: "-updated",
          filter: TEAMS_ARCHIVED_FILTER,
        });
        return list as Team[];
      }),
  });
}

export function useTeamMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: TeamInput) => {
      return rateLimitedWithRetry(async () => {
        const col = getCollection("teams");
        return col.create(withCreatedAuditFields(data));
      });
    },
    onSettled: () => {
      invalidateTeamQueries(queryClient);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TeamInput & { id: string }) => {
      const { id, ...patch } = data;
      return rateLimited(async () => {
        const col = getCollection("teams");
        return col.update(id, withUpdatedAuditField(patch));
      });
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.teams });
      const prev = queryClient.getQueryData<Team[]>(queryKeys.teams);
      const { id, ...patch } = data;
      queryClient.setQueryData<Team[]>(queryKeys.teams, (old) =>
        old?.map((t) =>
          t.id === id
            ? { ...t, ...patch, updated: new Date().toISOString() }
            : t
        ) ?? old
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev != null) {
        queryClient.setQueryData(queryKeys.teams, ctx.prev);
      }
    },
    onSettled: () => {
      invalidateTeamQueries(queryClient);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const teamsCol = getCollection("teams");
      const participantsCol = getCollection("participants");
      const members = await rateLimited(() =>
        participantsCol.getFullList({
          filter: `team = "${id}"`,
        }),
      );
      for (const p of members) {
        await rateLimited(() =>
          participantsCol.update(
            p.id,
            withUpdatedAuditField({
              team: "",
              status: "unassigned",
            }),
          ),
        );
      }
      return rateLimited(() =>
        teamsCol.update(id, withUpdatedAuditField({ archived: true })),
      );
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.teams });
      const prev = queryClient.getQueryData<Team[]>(queryKeys.teams);
      queryClient.setQueryData<Team[]>(queryKeys.teams, (old) =>
        old?.filter((t) => t.id !== id) ?? old
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev != null) {
        queryClient.setQueryData(queryKeys.teams, ctx.prev);
      }
    },
    onSettled: () => {
      invalidateTeamQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.participants });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      return rateLimited(async () => {
        const col = getCollection("teams");
        return col.update(id, withUpdatedAuditField({ archived: false }));
      });
    },
    onSettled: () => {
      invalidateTeamQueries(queryClient);
    },
  });

  return {
    create: {
      mutate: (data: TeamInput) => createMutation.mutate(data),
      mutateAsync: (data: TeamInput) => createMutation.mutateAsync(data),
    },
    update: {
      mutate: (data: TeamInput & { id: string }) =>
        updateMutation.mutate(data),
      mutateAsync: (data: TeamInput & { id: string }) =>
        updateMutation.mutateAsync(data),
    },
    archive: {
      mutate: (id: string) => archiveMutation.mutate(id),
      mutateAsync: (id: string) => archiveMutation.mutateAsync(id),
      isPending: archiveMutation.isPending,
    },
    restore: {
      mutate: (id: string) => restoreMutation.mutate(id),
      mutateAsync: (id: string) => restoreMutation.mutateAsync(id),
    },
  };
}
