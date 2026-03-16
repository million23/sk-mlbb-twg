import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import { queryKeys } from "@/lib/query-keys";
import type { Collections } from "@/types/pocketbase-types";

type TeamInput = Partial<
  Omit<Collections["teams"], "id" | "created" | "updated">
>;
type Team = Collections["teams"];

export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("teams");
        const list = await col.getFullList({ sort: "-created" });
        return list as Team[];
      }),
  });
}

export function useTeamMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: TeamInput) => {
      return rateLimited(async () => {
        const col = getCollection("teams");
        return col.create(data);
      });
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.teams });
      const prev = queryClient.getQueryData<Team[]>(queryKeys.teams);
      const temp: Team = {
        id: `temp-${Date.now()}`,
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };
      queryClient.setQueryData<Team[]>(queryKeys.teams, (old) =>
        old ? [temp, ...old] : [temp]
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev != null) {
        queryClient.setQueryData(queryKeys.teams, ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TeamInput & { id: string }) => {
      const { id, ...patch } = data;
      return rateLimited(async () => {
        const col = getCollection("teams");
        return col.update(id, patch);
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
      queryClient.invalidateQueries({ queryKey: queryKeys.teams });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return rateLimited(async () => {
        const col = getCollection("teams");
        return col.delete(id);
      });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.teams });
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
    delete: {
      mutate: (id: string) => deleteMutation.mutate(id),
      mutateAsync: (id: string) => deleteMutation.mutateAsync(id),
    },
  };
}
