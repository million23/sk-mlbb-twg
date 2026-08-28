import type { AdminAuthRecord } from "@/lib/admin/permissions";
import {
  ensureCommitteeAuth,
  isCommitteeSessionValid,
} from "@/lib/supabase/committee-auth";
import { redirect } from "@tanstack/react-router";

/**
 * TanStack Router `beforeLoad` helper: redirect when the signed-in admin
 * fails a capability check.
 */
export function requirePermission(
  check: (auth: AdminAuthRecord) => boolean,
  fallback: "/app" | "/app/auth/login" = "/app",
) {
  return async () => {
    if (typeof window === "undefined") return;
    const snap = await ensureCommitteeAuth();
    if (!isCommitteeSessionValid(snap)) {
      throw redirect({ to: "/app/auth/login" });
    }
    if (!check(snap.admin)) {
      throw redirect({ to: fallback });
    }
  };
}
