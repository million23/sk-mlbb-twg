import { adminCommitteeKeys } from "@/hooks/admin/admin-query-keys";
import type { AdminsRecord } from "@/hooks/orval/model/adminsRecord";
import type { AdminsRecordRole } from "@/hooks/orval/model/adminsRecordRole";
import { canManageAdmins } from "@/lib/admin/permissions";
import { getAuthRecordId } from "@/lib/legacy/mutation-authors";
import {
  getCommitteeAdminRecord,
} from "@/lib/supabase/committee-auth";
import { supabase } from "@/lib/supabase/client";
import { throwIfError } from "@/lib/supabase/errors";
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
  if (!canManageAdmins(getCommitteeAdminRecord())) {
    throw new Error("Only superadmins can manage admin accounts.");
  }
}

function toCommitteeAdmin(
  row: {
    id: string;
    email: string;
    name: string;
    role: AdminsRecordRole;
    is_active: boolean;
    last_login_at: string | null;
    created: string;
    updated: string;
  },
): CommitteeAdmin {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    is_active: row.is_active,
    last_login_at: row.last_login_at ?? undefined,
    created: row.created,
    updated: row.updated,
  };
}

export function committeeAdminsQueryOptions() {
  return queryOptions({
    queryKey: adminCommitteeKeys.admins(),
    queryFn: async () => {
      const data = throwIfError(
        await supabase
          .from("admins")
          .select("id,email,name,role,is_active,last_login_at,created,updated")
          .order("created", { ascending: false }),
      );
      return (data ?? []).map(toCommitteeAdmin);
    },
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
    mutationFn: async (_values: AdminFormValues) => {
      assertCanManage();
      throw new Error(
        "Create committee users in Supabase Authentication (Add user). The trigger writes the admins row. Then edit role and name here.",
      );
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
      if (values.password || values.passwordConfirm) {
        throw new Error(
          "Password changes happen in Supabase Authentication, not in this form.",
        );
      }
      return throwIfError(
        await supabase
          .from("admins")
          .update({
            name: values.name.trim(),
            role: values.role,
            is_active: values.is_active,
          })
          .eq("id", id)
          .select("id,email,name,role,is_active,last_login_at,created,updated")
          .single(),
      );
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
      throwIfError(await supabase.from("admins").delete().eq("id", id));
      return id;
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

export function adminMutationErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Request failed";
}

export type { AdminsRecord };
