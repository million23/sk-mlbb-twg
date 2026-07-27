import type { AdminAuthRecord } from "@/lib/admin/permissions";
import { pb } from "@/lib/pocketbase";
import { redirect } from "@tanstack/react-router";

/**
 * TanStack Router `beforeLoad` helper: redirect when the signed-in admin
 * fails a capability check.
 */
export function requirePermission(
  check: (auth: AdminAuthRecord) => boolean,
  fallback: "/app" | "/app/auth/login" = "/app",
) {
  return () => {
    if (typeof window === "undefined") return;
    if (!pb.authStore.isValid) {
      throw redirect({ to: "/app/auth/login" });
    }
    if (!check(pb.authStore.record)) {
      throw redirect({ to: fallback });
    }
  };
}
