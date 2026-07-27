import { AdminsPage } from "@/components/admin/admins/admins-page";
import { useAdminRbac } from "@/hooks/admin/use-admin-rbac";
import {
  adminMutationErrorMessage,
  useCommitteeAdminMutations,
  useCommitteeAdmins,
} from "@/hooks/admin/use-committee-admins";
import { canViewAdmins } from "@/lib/admin/permissions";
import { requirePermission } from "@/lib/admin/require-permission";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/app/_authed/admins")({
  beforeLoad: requirePermission(canViewAdmins),
  component: AdminsRoutePage,
});

function AdminsRoutePage() {
  const rbac = useAdminRbac();
  const adminsQuery = useCommitteeAdmins();
  const mutations = useCommitteeAdminMutations();

  return (
    <AdminsPage
      admins={adminsQuery.data ?? []}
      currentUserId={rbac.auth?.id}
      canManage={rbac.canManageAdmins}
      isLoading={adminsQuery.isLoading}
      isError={adminsQuery.isError}
      errorMessage={
        adminsQuery.error instanceof Error
          ? adminsQuery.error.message
          : undefined
      }
      formPending={mutations.create.isPending || mutations.update.isPending}
      deletePending={mutations.remove.isPending}
      onRetry={() => {
        void adminsQuery.refetch();
      }}
      canDelete={rbac.canDeleteAdmin}
      onCreate={async (values) => {
        try {
          await mutations.create.mutateAsync(values);
          toast.success("Admin added");
        } catch (err) {
          toast.error(adminMutationErrorMessage(err));
          throw err;
        }
      }}
      onUpdate={async (id, values) => {
        try {
          await mutations.update.mutateAsync({
            id,
            values: {
              name: values.name,
              role: values.role,
              is_active: values.is_active,
              ...(values.password
                ? {
                    password: values.password,
                    passwordConfirm: values.passwordConfirm,
                  }
                : {}),
            },
          });
          toast.success("Admin updated");
        } catch (err) {
          toast.error(adminMutationErrorMessage(err));
          throw err;
        }
      }}
      onDelete={async (id) => {
        try {
          await mutations.remove.mutateAsync(id);
          toast.success("Admin removed");
        } catch (err) {
          toast.error(adminMutationErrorMessage(err));
          throw err;
        }
      }}
    />
  );
}
