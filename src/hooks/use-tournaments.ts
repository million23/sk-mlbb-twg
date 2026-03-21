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

export function useTournaments() {
  return useQuery({
    queryKey: queryKeys.tournaments,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("tournaments");
        const list = await col.getFullList({ sort: "-created" });
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
          filter: 'status = "upcoming"',
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
          filter: 'status = "live"',
          sort: "startAt",
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
      queryClient.invalidateQueries({ queryKey: queryKeys.tournaments });
      queryClient.invalidateQueries({ queryKey: queryKeys.publicUpcoming });
      queryClient.invalidateQueries({ queryKey: queryKeys.publicCurrent });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.tournaments });
      queryClient.invalidateQueries({ queryKey: queryKeys.publicUpcoming });
      queryClient.invalidateQueries({ queryKey: queryKeys.publicCurrent });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return rateLimited(async () => {
        const col = getCollection("tournaments");
        return col.delete(id);
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
      queryClient.invalidateQueries({ queryKey: queryKeys.tournaments });
      queryClient.invalidateQueries({ queryKey: queryKeys.publicUpcoming });
      queryClient.invalidateQueries({ queryKey: queryKeys.publicCurrent });
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
    delete: {
      mutate: (id: string) => deleteMutation.mutate(id),
      mutateAsync: (id: string) => deleteMutation.mutateAsync(id),
    },
  };
}
