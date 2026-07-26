import { AdminShell } from "@/components/admin/admin-shell";
import { pb } from "@/lib/pocketbase";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/_authed")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !pb.authStore.isValid) {
      throw redirect({ to: "/app/auth/login" });
    }
  },
  component: AuthedAdminLayout,
});

function AuthedAdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
