import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import { queryKeys } from "@/lib/query-keys";
import type { Collections } from "@/types/pocketbase-types";

type TeamInput = Partial<
  Omit<Collections["teams"], "id" | "created" | "updated">
>;

export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("teams");
        const list = await col.getFullList({ sort: "-created" });
        return list as Collections["teams"][];
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
    onSuccess: () => {
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
    onSuccess: () => {
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
    onSuccess: () => {
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
