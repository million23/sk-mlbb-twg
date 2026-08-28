import { canAccessAdminApp } from "@/lib/admin/permissions";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  ensureCommitteeAuth,
  isCommitteeSessionValid,
  signOutCommittee,
} from "@/lib/supabase/committee-auth";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/_authed")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const snap = await ensureCommitteeAuth();
    if (!isCommitteeSessionValid(snap)) {
      throw redirect({ to: "/app/auth/login" });
    }
    if (!canAccessAdminApp(snap.admin)) {
      await signOutCommittee();
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
