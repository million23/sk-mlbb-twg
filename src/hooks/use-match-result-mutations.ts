import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthRecordId } from "@/lib/mutation-authors";
import { getCollection } from "@/lib/pocketbase";
import { queryKeys } from "@/lib/query-keys";
import { rateLimited } from "@/lib/rate-limited-api";
import type { Collections } from "@/types/pocketbase-types";

type MatchResultInput = Partial<
  Omit<Collections["match_result"], "id" | "created" | "updated">
>;

function invalidateMatchResults(
  queryClient: ReturnType<typeof useQueryClient>,
  matchId?: string,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.matchResults });
  if (matchId) {
    queryClient.invalidateQueries({
      queryKey: [...queryKeys.matchResults, matchId],
    });
  }
}

export function useMatchResultMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: MatchResultInput) => {
      return rateLimited(async () => {
        const col = getCollection("match_result");
        const uid = getAuthRecordId();
        return col.create({
          ...data,
          ...(uid ? { created_by: uid, updated_by: uid } : {}),
        });
      });
    },
    onSettled: (_data, _error, variables) => {
      invalidateMatchResults(queryClient, variables?.match);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MatchResultInput & { id: string }) => {
      const { id, ...patch } = data;
      return rateLimited(async () => {
        const col = getCollection("match_result");
        const uid = getAuthRecordId();
        return col.update(id, {
          ...patch,
          ...(uid ? { updated_by: uid } : {}),
        });
      });
    },
    onSettled: (_data, _error, variables) => {
      invalidateMatchResults(queryClient, variables?.match);
    },
  });

  return {
    create: {
      mutate: createMutation.mutate,
      mutateAsync: createMutation.mutateAsync,
      isPending: createMutation.isPending,
    },
    update: {
      mutate: updateMutation.mutate,
      mutateAsync: updateMutation.mutateAsync,
      isPending: updateMutation.isPending,
    },
  };
}
