import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { withCreatedAuditFields, withUpdatedAuditField } from "@/lib/mutation-authors";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import { queryKeys } from "@/lib/query-keys";
import type { Collections } from "@/types/pocketbase-types";

type TournamentInput = Partial<
  Omit<Collections["tournaments"], "id" | "created" | "updated">
>;
type Tournament = Collections["tournaments"];

/** PocketBase filter: not soft-deleted. */
export const TOURNAMENTS_ACTIVE_FILTER = "archived != true";

const TOURNAMENTS_ARCHIVED_FILTER = "archived = true";

function invalidateTournamentQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments });
  queryClient.invalidateQueries({ queryKey: queryKeys.tournamentsArchived });
  queryClient.invalidateQueries({ queryKey: queryKeys.publicUpcoming });
  queryClient.invalidateQueries({ queryKey: queryKeys.publicCurrent });
  queryClient.invalidateQueries({ queryKey: queryKeys.draftSuggestions });
}

export function useTournaments() {
  return useQuery({
    queryKey: queryKeys.tournaments,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("tournaments");
        const list = await col.getFullList({
          sort: "-created",
          filter: TOURNAMENTS_ACTIVE_FILTER,
        });
        return list as Tournament[];
      }),
  });
}

export function useUpcomingTournaments() {
  return useQuery({
    queryKey: [...queryKeys.tournaments, "upcoming"],
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("tournaments");
        const list = await col.getFullList({
          filter: `${TOURNAMENTS_ACTIVE_FILTER} && status = "upcoming"`,
          sort: "startAt",
        });
        return list as Tournament[];
      }),
  });
}

export function useCurrentTournaments() {
  return useQuery({
    queryKey: [...queryKeys.tournaments, "current"],
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("tournaments");
        const list = await col.getFullList({
          filter: `${TOURNAMENTS_ACTIVE_FILTER} && status = "live"`,
          sort: "startAt",
        });
        return list as Tournament[];
      }),
  });
}

export function useArchivedTournaments() {
  return useQuery({
    queryKey: queryKeys.tournamentsArchived,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("tournaments");
        const list = await col.getFullList({
          sort: "-updated",
          filter: TOURNAMENTS_ARCHIVED_FILTER,
        });
        return list as Tournament[];
      }),
  });
}

export function useTournamentMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: TournamentInput) => {
      return rateLimited(async () => {
        const col = getCollection("tournaments");
        return col.create(withCreatedAuditFields(data));
      });
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tournaments });
      const prev = queryClient.getQueryData<Tournament[]>(queryKeys.tournaments);
      const temp: Tournament = {
        id: `temp-${Date.now()}`,
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };
      queryClient.setQueryData<Tournament[]>(queryKeys.tournaments, (old) =>
        old ? [temp, ...old] : [temp]
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev != null) {
        queryClient.setQueryData(queryKeys.tournaments, ctx.prev);
      }
    },
    onSettled: () => {
      invalidateTournamentQueries(queryClient);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TournamentInput & { id: string }) => {
      const { id, ...patch } = data;
      return rateLimited(async () => {
        const col = getCollection("tournaments");
        return col.update(id, withUpdatedAuditField(patch));
      });
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tournaments });
      const prev = queryClient.getQueryData<Tournament[]>(queryKeys.tournaments);
      const { id, ...patch } = data;
      queryClient.setQueryData<Tournament[]>(queryKeys.tournaments, (old) =>
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
        queryClient.setQueryData(queryKeys.tournaments, ctx.prev);
      }
    },
    onSettled: () => {
      invalidateTournamentQueries(queryClient);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return rateLimited(async () => {
        const col = getCollection("tournaments");
        return col.update(id, withUpdatedAuditField({ archived: true }));
      });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tournaments });
      const prev = queryClient.getQueryData<Tournament[]>(queryKeys.tournaments);
      queryClient.setQueryData<Tournament[]>(queryKeys.tournaments, (old) =>
        old?.filter((t) => t.id !== id) ?? old
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev != null) {
        queryClient.setQueryData(queryKeys.tournaments, ctx.prev);
      }
    },
    onSettled: () => {
      invalidateTournamentQueries(queryClient);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      return rateLimited(async () => {
        const col = getCollection("tournaments");
        return col.update(id, withUpdatedAuditField({ archived: false }));
      });
    },
    onSettled: () => {
      invalidateTournamentQueries(queryClient);
    },
  });

  return {
    create: {
      mutate: (data: TournamentInput) => createMutation.mutate(data),
      mutateAsync: (data: TournamentInput) => createMutation.mutateAsync(data),
    },
    update: {
      mutate: (data: TournamentInput & { id: string }) =>
        updateMutation.mutate(data),
      mutateAsync: (data: TournamentInput & { id: string }) =>
        updateMutation.mutateAsync(data),
    },
    archive: {
      mutate: (id: string) => archiveMutation.mutate(id),
      mutateAsync: (id: string) => archiveMutation.mutateAsync(id),
    },
    restore: {
      mutate: (id: string) => restoreMutation.mutate(id),
      mutateAsync: (id: string) => restoreMutation.mutateAsync(id),
    },
  };
}
