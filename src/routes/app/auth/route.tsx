import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/auth")({
  beforeLoad: ({ location }) => {
    // /app/auth → login; keep nested paths as-is
    if (location.pathname.replace(/\/$/, "") === "/app/auth") {
      throw redirect({ to: "/app/auth/login" });
    }
  },
  component: AdminAuthLayout,
});

function AdminAuthLayout() {
  return <Outlet />;
}
