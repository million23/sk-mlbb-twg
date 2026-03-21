import { pb } from "@/lib/pocketbase";

/** Current PocketBase auth record id (`admins` collection), if signed in. */
export function getAuthRecordId(): string | undefined {
  const m = pb.authStore.model ?? pb.authStore.record;
  return m?.id;
}

/** Set both audit fields on create (POST). */
export function withCreatedAuditFields<T extends object>(data: T): T {
  const uid = getAuthRecordId();
  if (!uid) return data;
  return { ...data, createdBy: uid, updatedBy: uid };
}

/** Set `updatedBy` on update (PATCH). */
export function withUpdatedAuditField<T extends object>(data: T): T {
  const uid = getAuthRecordId();
  if (!uid) return data;
  return { ...data, updatedBy: uid };
}
