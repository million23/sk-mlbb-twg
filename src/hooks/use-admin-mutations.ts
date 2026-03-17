import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import { queryKeys } from "@/lib/query-keys";
import type { AdminRole } from "@/types/pocketbase-types";

type CreateAdminInput = {
  email: string;
  password: string;
  passwordConfirm: string;
  name?: string;
  role?: AdminRole;
  isActive?: boolean;
};

type UpdateAdminInput = {
  id: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  name?: string;
  role?: AdminRole;
  isActive?: boolean;
};

export function useAdminMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: CreateAdminInput) => {
      return rateLimited(async () => {
        const col = getCollection("admins");
        return col.create({
          ...data,
          emailVisibility: true,
        });
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admins });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateAdminInput) => {
      const { id, ...patch } = data;
      const body: Record<string, unknown> = {
        ...patch,
        emailVisibility: true,
      };
      if (patch.password && patch.passwordConfirm) {
        body.password = patch.password;
        body.passwordConfirm = patch.passwordConfirm;
      } else {
        delete body.password;
        delete body.passwordConfirm;
      }
      return rateLimited(async () => {
        const col = getCollection("admins");
        return col.update(id, body);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admins });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return rateLimited(async () => {
        const col = getCollection("admins");
        return col.delete(id);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admins });
    },
  });

  return {
    create: {
      mutate: (data: CreateAdminInput) => createMutation.mutate(data),
      mutateAsync: (data: CreateAdminInput) => createMutation.mutateAsync(data),
      isPending: createMutation.isPending,
    },
    update: {
      mutate: (data: UpdateAdminInput) => updateMutation.mutate(data),
      mutateAsync: (data: UpdateAdminInput) => updateMutation.mutateAsync(data),
      isPending: updateMutation.isPending,
    },
    delete: {
      mutate: (id: string) => deleteMutation.mutate(id),
      mutateAsync: (id: string) => deleteMutation.mutateAsync(id),
      isPending: deleteMutation.isPending,
    },
  };
}
