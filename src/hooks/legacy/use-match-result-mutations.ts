import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthRecordId } from "@/lib/legacy/mutation-authors";
import { queryKeys } from "@/lib/legacy/query-keys";
import { supabase } from "@/lib/supabase/client";
import { throwIfError } from "@/lib/supabase/errors";
import type { Collections } from "@/types/__pocketbase-types";

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
      const uid = getAuthRecordId();
      return throwIfError(
        await supabase
          .from("match_result")
          .insert({
            ...data,
            ...(uid ? { created_by: uid, updated_by: uid } : {}),
          } as never)
          .select("*")
          .single(),
      );
    },
    onSettled: (_data, _error, variables) => {
      invalidateMatchResults(queryClient, variables?.match);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MatchResultInput & { id: string }) => {
      const { id, ...patch } = data;
      const uid = getAuthRecordId();
      return throwIfError(
        await supabase
          .from("match_result")
          .update({
            ...patch,
            ...(uid ? { updated_by: uid } : {}),
          } as never)
          .eq("id", id)
          .select("*")
          .single(),
      );
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
