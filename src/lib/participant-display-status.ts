import type { Collections } from "@/types/pocketbase-types";

type ParticipantStatus = NonNullable<Collections["participants"]["status"]>;

type Team = Collections["teams"] & { id: string };

/**
 * Status shown in the UI for `assigned` participants: must match a real team
 * row when the teams list is available. Empty `team` or orphan `team` ids
 * (e.g. deleted/archived team) show as unassigned. While `teams` is still
 * loading (`undefined`), keeps the stored `assigned` value to avoid a wrong flash.
 */
export function effectiveParticipantStatus(
  participant: { status?: ParticipantStatus; team?: string },
  teams: Team[] | undefined,
): ParticipantStatus {
  const raw = participant.status ?? "unassigned";
  if (raw !== "assigned") return raw;

  const teamId = participant.team;
  if (!teamId) return "unassigned";

  if (teams === undefined) return raw;

  const exists = teams.some((t) => t.id === teamId);
  return exists ? "assigned" : "unassigned";
}
