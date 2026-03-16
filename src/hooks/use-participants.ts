import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import { queryKeys } from "@/lib/query-keys";
import type { Collections } from "@/types/pocketbase-types";

type ParticipantInput = Partial<
  Omit<Collections["participants"], "id" | "created" | "updated">
>;
type Participant = Collections["participants"];

export function useParticipants() {
  return useQuery({
    queryKey: queryKeys.participants,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("participants");
        const list = await col.getFullList({ sort: "-created" });
        return list as Participant[];
      }),
  });
}

export function useParticipantMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: ParticipantInput) => {
      return rateLimited(async () => {
        const col = getCollection("participants");
        return col.create(data);
      });
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.participants });
      const prev = queryClient.getQueryData<Participant[]>(queryKeys.participants);
      const temp: Participant = {
        id: `temp-${Date.now()}`,
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };
      queryClient.setQueryData<Participant[]>(queryKeys.participants, (old) =>
        old ? [temp, ...old] : [temp]
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev != null) {
        queryClient.setQueryData(queryKeys.participants, ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.participants });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ParticipantInput & { id: string }) => {
      const { id, ...patch } = data;
      return rateLimited(async () => {
        const col = getCollection("participants");
        return col.update(id, patch);
      });
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.participants });
      const prev = queryClient.getQueryData<Participant[]>(queryKeys.participants);
      const { id, ...patch } = data;
      queryClient.setQueryData<Participant[]>(queryKeys.participants, (old) =>
        old?.map((p) =>
          p.id === id
            ? { ...p, ...patch, updated: new Date().toISOString() }
            : p
        ) ?? old
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev != null) {
        queryClient.setQueryData(queryKeys.participants, ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.participants });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return rateLimited(async () => {
        const col = getCollection("participants");
        return col.delete(id);
      });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.participants });
      const prev = queryClient.getQueryData<Participant[]>(queryKeys.participants);
      queryClient.setQueryData<Participant[]>(queryKeys.participants, (old) =>
        old?.filter((p) => p.id !== id) ?? old
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev != null) {
        queryClient.setQueryData(queryKeys.participants, ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.participants });
    },
  });

  return {
    create: {
      mutate: (data: ParticipantInput) => createMutation.mutate(data),
      mutateAsync: (data: ParticipantInput) => createMutation.mutateAsync(data),
    },
    update: {
      mutate: (data: ParticipantInput & { id: string }) =>
        updateMutation.mutate(data),
      mutateAsync: (data: ParticipantInput & { id: string }) =>
        updateMutation.mutateAsync(data),
    },
    delete: {
      mutate: (id: string) => deleteMutation.mutate(id),
      mutateAsync: (id: string) => deleteMutation.mutateAsync(id),
    },
  };
}
