import { AdminShell } from "@/components/admin/admin-shell";
import { canAccessAdminApp } from "@/lib/admin/permissions";
import { pb } from "@/lib/pocketbase";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/_authed")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!pb.authStore.isValid) {
      throw redirect({ to: "/app/auth/login" });
    }
    if (!canAccessAdminApp(pb.authStore.record)) {
      pb.authStore.clear();
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
