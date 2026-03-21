import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createMutationQueue } from "@/lib/mutation-queue";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import {
  normalizeParticipantContactIfPresent,
  normalizeParticipantForCreate,
} from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import type { Collections } from "@/types/pocketbase-types";
import { useRef } from "react";

type ParticipantInput = Partial<
  Omit<Collections["participants"], "id" | "created" | "updated">
>;
type Participant = Collections["participants"];

/** Page size for {@link useParticipantsInfinite}. */
export const PARTICIPANTS_PAGE_SIZE = 30;

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

export function useParticipantsInfinite(pageSize = PARTICIPANTS_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.participants, "infinite", pageSize] as const,
    queryFn: ({ pageParam }) =>
      rateLimited(async () => {
        const col = getCollection("participants");
        return col.getList(pageParam, pageSize, { sort: "-created" });
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}

const ADD_MEMBER_QUEUE_INTERVAL_MS = 400;

export function useParticipantMutations() {
  const queryClient = useQueryClient();
  const addMemberQueue = useRef(
    createMutationQueue(ADD_MEMBER_QUEUE_INTERVAL_MS),
  ).current;

  const invalidateParticipants = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.participants });
  };

  const createMutation = useMutation({
    mutationFn: async (data: ParticipantInput) => {
      const payload = normalizeParticipantForCreate(data);
      return rateLimited(async () => {
        const col = getCollection("participants");
        return col.create(payload);
      });
    },
    onSettled: () => {
      invalidateParticipants();
      queryClient.invalidateQueries({ queryKey: queryKeys.teamSuggestions });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ParticipantInput & { id: string }) => {
      const { id, ...patch } = normalizeParticipantContactIfPresent(data);
      return rateLimited(async () => {
        const col = getCollection("participants");
        return col.update(id, patch);
      });
    },
    onSettled: () => {
      invalidateParticipants();
      queryClient.invalidateQueries({ queryKey: queryKeys.teamSuggestions });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return rateLimited(async () => {
        const col = getCollection("participants");
        return col.delete(id);
      });
    },
    onSettled: () => {
      invalidateParticipants();
      queryClient.invalidateQueries({ queryKey: queryKeys.teamSuggestions });
    },
  });

  const updateQueued = (data: ParticipantInput & { id: string }) => {
    const { id, ...patch } = normalizeParticipantContactIfPresent(data);
    addMemberQueue.enqueue(async () => {
      try {
        await rateLimited(async () => {
          const col = getCollection("participants");
          return col.update(id, patch);
        });
      } finally {
        invalidateParticipants();
        queryClient.invalidateQueries({ queryKey: queryKeys.teamSuggestions });
      }
    });
  };

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
      mutateQueued: updateQueued,
    },
    delete: {
      mutate: (id: string) => deleteMutation.mutate(id),
      mutateAsync: (id: string) => deleteMutation.mutateAsync(id),
    },
  };
}
