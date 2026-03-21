import type { Collections } from "@/types/pocketbase-types";

export function buildAdminNameByIdMap(
  admins: Collections["admins"][] | undefined | null,
): ReadonlyMap<string, string> {
  const m = new Map<string, string>();
  for (const a of admins ?? []) {
    const label = a.name?.trim() || a.email;
    if (label) m.set(a.id, label);
  }
  return m;
}

/** Resolve PocketBase user/admin id + optional expanded record; fall back to admins list by id. */
export function formatAuditActor(
  raw: unknown,
  expanded:
    | { name?: string; email?: string; username?: string; id?: string }
    | null
    | undefined,
  adminNameById?: ReadonlyMap<string, string>,
): string {
  if (expanded && typeof expanded === "object") {
    const name = expanded.name?.trim();
    if (name) return name;
    const email = expanded.email ?? expanded.username;
    if (email) return email;
    if (expanded.id) {
      const fromAdmins = adminNameById?.get(expanded.id);
      if (fromAdmins) return fromAdmins;
      return expanded.id;
    }
  }
  if (raw == null || raw === "") return "—";
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return "—";
    const fromAdmins = adminNameById?.get(trimmed);
    if (fromAdmins) return fromAdmins;
    return trimmed;
  }
  if (typeof raw === "object" && raw !== null) {
    const o = raw as { name?: string; email?: string; id?: string };
    if (o.name?.trim()) return o.name.trim();
    if (o.email) return o.email;
    if (o.id) {
      const fromAdmins = adminNameById?.get(o.id);
      if (fromAdmins) return fromAdmins;
      return o.id;
    }
  }
  return String(raw);
}
