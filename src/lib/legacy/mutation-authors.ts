import { getAuthRecordId } from "@/lib/supabase/committee-auth";

export { getAuthRecordId };

/** Set both audit fields on create (POST). */
export function withCreatedAuditFields<T extends object>(data: T): T {
  const uid = getAuthRecordId();
  if (!uid) return data;
  return { ...data, created_by: uid, updated_by: uid };
}

/** Set `updated_by` on update (PATCH). */
export function withUpdatedAuditField<T extends object>(data: T): T {
  const uid = getAuthRecordId();
  if (!uid) return data;
  return { ...data, updated_by: uid };
}
