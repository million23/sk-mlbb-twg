import {
  withCreatedAuditFields,
  withUpdatedAuditField,
} from "@/lib/mutation-authors";
import { createMutationQueue } from "@/lib/mutation-queue";
import { getCollection } from "@/lib/pocketbase";
import { queryKeys } from "@/lib/query-keys";
import { rateLimited } from "@/lib/rate-limited-api";
import {
  normalizeParticipantContactIfPresent,
  normalizeParticipantForCreate,
} from "@/lib/utils";
import type { Collections } from "@/types/pocketbase-types";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRef } from "react";

type ParticipantInput = Partial<
  Omit<Collections["participants"], "id" | "created" | "updated">
>;
type Participant = Collections["participants"];

/** PocketBase filter: not soft-deleted (includes records with no `archived` field). */
export const PARTICIPANTS_ACTIVE_FILTER = "archived != true";

const PARTICIPANTS_ARCHIVED_FILTER = "archived = true";

/** Page size for {@link useParticipantsInfinite}. */
export const PARTICIPANTS_PAGE_SIZE = 30;

function invalidateParticipantQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.participants });
  queryClient.invalidateQueries({ queryKey: queryKeys.participantsArchived });
  queryClient.invalidateQueries({ queryKey: queryKeys.teamSuggestions });
  queryClient.invalidateQueries({ queryKey: queryKeys.draftSuggestions });
}

export function useParticipants() {
  return useQuery({
    queryKey: queryKeys.participants,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("participants");
        const list = await col.getFullList({
          sort: "-created",
          filter: PARTICIPANTS_ACTIVE_FILTER,
        });
        return list as Participant[];
      }),
  });
}

export function useArchivedParticipants() {
  return useQuery({
    queryKey: queryKeys.participantsArchived,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("participants");
        const list = await col.getFullList({
          sort: "-updated",
          filter: PARTICIPANTS_ARCHIVED_FILTER,
        });
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
        return col.getList(pageParam, pageSize, {
          sort: "-created",
          filter: PARTICIPANTS_ACTIVE_FILTER,
        });
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
    invalidateParticipantQueries(queryClient);
  };

  const createMutation = useMutation({
    mutationFn: async (data: ParticipantInput) => {
      const payload = withCreatedAuditFields(
        normalizeParticipantForCreate(data),
      );
      return rateLimited(async () => {
        const col = getCollection("participants");
        return col.create(payload);
      });
    },
    onSettled: () => {
      invalidateParticipants();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ParticipantInput & { id: string }) => {
      const { id, ...patch } = normalizeParticipantContactIfPresent(data);
      return rateLimited(async () => {
        const col = getCollection("participants");
        return col.update(id, withUpdatedAuditField(patch));
      });
    },
    onSettled: () => {
      invalidateParticipants();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return rateLimited(async () => {
        const col = getCollection("participants");
        return col.update(
          id,
          withUpdatedAuditField({
            archived: true,
            team: "",
            status: "unassigned",
          }),
        );
      });
    },
    onSettled: () => {
      invalidateParticipants();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      return rateLimited(async () => {
        const col = getCollection("participants");
        return col.update(id, withUpdatedAuditField({ archived: false }));
      });
    },
    onSettled: () => {
      invalidateParticipants();
    },
  });

  const updateQueued = (data: ParticipantInput & { id: string }) => {
    const { id, ...patch } = normalizeParticipantContactIfPresent(data);
    addMemberQueue.enqueue(async () => {
      try {
        await rateLimited(async () => {
          const col = getCollection("participants");
          return col.update(id, withUpdatedAuditField(patch));
        });
      } finally {
        invalidateParticipants();
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
