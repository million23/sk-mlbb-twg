import { adminCommitteeKeys } from "@/hooks/admin/admin-query-keys";
import type { AdminsRecord } from "@/hooks/orval/model/adminsRecord";
import type { AdminsRecordRole } from "@/hooks/orval/model/adminsRecordRole";
import { canManageAdmins, type AdminAuthRecord } from "@/lib/admin/permissions";
import { getAuthRecordId } from "@/lib/legacy/mutation-authors";
import { getCollection, pb } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export type CommitteeAdmin = {
  id: string;
  email?: string;
  name?: string;
  role?: AdminsRecordRole;
  is_active?: boolean;
  last_login_at?: string;
  created?: string;
  updated?: string;
};

export type AdminFormValues = {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  role: AdminsRecordRole;
  is_active: boolean;
};

function assertCanManage() {
  const auth = pb.authStore.record as AdminAuthRecord;
  if (!canManageAdmins(auth)) {
    throw new Error("Only superadmins can manage admin accounts.");
  }
}

function normalizeAdmin(row: Record<string, unknown>): CommitteeAdmin | null {
  const id = typeof row.id === "string" ? row.id : "";
  if (!id) return null;
  const isActive =
    typeof row.is_active === "boolean"
      ? row.is_active
      : typeof row.isActive === "boolean"
        ? row.isActive
        : true;
  return {
    id,
    email: typeof row.email === "string" ? row.email : undefined,
    name: typeof row.name === "string" ? row.name : undefined,
    role: (row.role as AdminsRecordRole | undefined) ?? undefined,
    is_active: isActive,
    last_login_at:
      (typeof row.last_login_at === "string" && row.last_login_at) ||
      (typeof row.lastLoginAt === "string" && row.lastLoginAt) ||
      undefined,
    created: typeof row.created === "string" ? row.created : undefined,
    updated: typeof row.updated === "string" ? row.updated : undefined,
  };
}

export function committeeAdminsQueryOptions() {
  return queryOptions({
    queryKey: adminCommitteeKeys.admins(),
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("admins");
        const list = await col.getFullList({
          sort: "-created",
          fields: "id,email,name,role,is_active,last_login_at,created,updated",
        });
        return (list as unknown as Record<string, unknown>[])
          .map(normalizeAdmin)
          .filter((a): a is CommitteeAdmin => a != null);
      }),
    refetchOnMount: "always",
  });
}

export function useCommitteeAdmins() {
  return useQuery(committeeAdminsQueryOptions());
}

export function useCommitteeAdminMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminCommitteeKeys.admins() });

  const create = useMutation({
    mutationFn: async (values: AdminFormValues) => {
      assertCanManage();
      return rateLimited(async () => {
        const col = getCollection("admins");
        return col.create({
          email: values.email.trim(),
          password: values.password,
          passwordConfirm: values.passwordConfirm,
          name: values.name.trim(),
          role: values.role,
          is_active: values.is_active,
          emailVisibility: true,
        } as never);
      });
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Omit<AdminFormValues, "email" | "password" | "passwordConfirm"> & {
        password?: string;
        passwordConfirm?: string;
      };
    }) => {
      assertCanManage();
      const body: Record<string, unknown> = {
        name: values.name.trim(),
        role: values.role,
        is_active: values.is_active,
        emailVisibility: true,
      };
      if (values.password && values.passwordConfirm) {
        body.password = values.password;
        body.passwordConfirm = values.passwordConfirm;
      }
      return rateLimited(async () => {
        const col = getCollection("admins");
        return col.update(id, body as never);
      });
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      assertCanManage();
      const selfId = getAuthRecordId();
      if (selfId && selfId === id) {
        throw new Error("You cannot remove your own admin account.");
      }
      return rateLimited(async () => {
        const col = getCollection("admins");
        return col.delete(id);
      });
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

export function adminMutationErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const pb = error as {
      message?: string;
      response?: {
        message?: string;
        data?: Record<string, { message?: string }>;
      };
    };
    const field = pb.response?.data
      ? Object.values(pb.response.data).find((v) => v?.message)?.message
      : undefined;
    if (field) return field;
    if (pb.response?.message) return pb.response.message;
    if (pb.message) return pb.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Request failed";
}

/** Narrow helper when a full AdminsRecord is needed for typing. */
export type { AdminsRecord };
