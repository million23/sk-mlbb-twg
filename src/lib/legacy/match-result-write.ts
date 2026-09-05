import type { Collections } from "@/types/__pocketbase-types";

export type MatchResultWriteInput = Partial<Collections["match_result"]>;

/**
 * `archived` is optional in PocketBase. POST/create must still send `false`.
 */
export function toMatchResultWritePayload(
  data: MatchResultWriteInput,
  mode: "create" | "update",
): MatchResultWriteInput {
  const body: MatchResultWriteInput = { ...data };
  if (mode === "create") {
    body.archived = false;
  }
  return body;
}
