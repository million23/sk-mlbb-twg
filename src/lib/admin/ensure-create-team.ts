import { getCollectionsParticipantsRecords } from "@/hooks/orval/participants-collection/participants-collection";
import { patchCollectionsParticipantsRecordsId } from "@/hooks/orval/participants-collection/participants-collection";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type { TeamsRecord } from "@/hooks/orval/model/teamsRecord";
import type { TeamsRecordStatus } from "@/hooks/orval/model/teamsRecordStatus";
import {
  getCollectionsTeamsRecords,
  postCollectionsTeamsRecords,
  patchCollectionsTeamsRecordsId,
} from "@/hooks/orval/teams-collection/teams-collection";
import { getAuthRecordId } from "@/lib/legacy/mutation-authors";
import {
  unwrapOrvalListItems,
  unwrapOrvalRecord,
} from "@/lib/registration/orval";

export type EnsureCreateTeamResult =
  | { formed: false; reason: "not_create_team" | "missing_name" | "still_pending" | "no_approved" }
  | {
      formed: true;
      teamId: string;
      teamName: string;
      memberCount: number;
      createdNew: boolean;
    };

function withAudit(
  data: Record<string, unknown>,
  mode: "create" | "update",
): Record<string, unknown> {
  const uid = getAuthRecordId();
  if (!uid) return data;
  if (mode === "create") return { ...data, created_by: uid, updated_by: uid };
  return { ...data, updated_by: uid };
}

function nameKey(raw: string | undefined | null): string {
  return (raw ?? "").trim().toLowerCase();
}

function statusForCount(
  memberCount: number,
  current: TeamsRecordStatus | undefined,
  minReady: number,
): TeamsRecordStatus | null {
  if (current === "inactive") return null;
  if (memberCount >= minReady) {
    return current === "ready" ? null : "ready";
  }
  if (memberCount === 0) {
    return current === "incomplete" ? null : "incomplete";
  }
  return current === "forming" ? null : "forming";
}

/**
 * After approving a create-team registrant: if every peer with the same
 * preferred team name is approved (none still pending), create/reuse the
 * team and assign all approved members.
 */
export async function ensureCreateTeamAfterApprove(input: {
  tournamentId: string;
  participant: ParticipantsRecord;
  minReady?: number;
}): Promise<EnsureCreateTeamResult> {
  const { tournamentId, participant, minReady = 5 } = input;
  if (participant.team_intent !== "create_team") {
    return { formed: false, reason: "not_create_team" };
  }
  const teamName = participant.preferred_team_name?.trim() ?? "";
  if (!teamName) {
    return { formed: false, reason: "missing_name" };
  }
  const key = nameKey(teamName);

  const peersRes = await getCollectionsParticipantsRecords({
    page: 1,
    perPage: 500,
    filter: `tournament = "${tournamentId}" && archived != true && team_intent = "create_team"`,
  });
  const peers = unwrapOrvalListItems<ParticipantsRecord>(peersRes).filter(
    (p) => nameKey(p.preferred_team_name) === key,
  );

  const active = peers.filter(
    (p) =>
      p.registration_status === "pending" ||
      p.registration_status === "approved",
  );
  if (active.some((p) => p.registration_status === "pending")) {
    return { formed: false, reason: "still_pending" };
  }

  const approved = active
    .filter((p) => p.registration_status === "approved")
    .sort((a, b) => (a.created ?? "").localeCompare(b.created ?? ""));
  if (approved.length === 0) {
    return { formed: false, reason: "no_approved" };
  }

  const teamsRes = await getCollectionsTeamsRecords({
    page: 1,
    perPage: 500,
    filter: `tournament = "${tournamentId}" && archived != true`,
  });
  const teams = unwrapOrvalListItems<TeamsRecord>(teamsRes);
  let team = teams.find((t) => nameKey(t.name) === key);
  let createdNew = false;

  if (!team?.id) {
    const status =
      statusForCount(approved.length, undefined, minReady) ?? "forming";
    const created = await postCollectionsTeamsRecords(
      withAudit(
        {
          tournament: tournamentId,
          name: teamName,
          status,
          archived: false,
          ...(approved[0]?.id ? { captain: approved[0].id } : {}),
        },
        "create",
      ) as unknown as TeamsRecord,
    );
    team = unwrapOrvalRecord<TeamsRecord>(created);
    createdNew = true;
  }

  const teamId = team.id;
  if (!teamId) {
    return { formed: false, reason: "no_approved" };
  }

  for (const p of approved) {
    if (!p.id) continue;
    if (p.team === teamId && p.status === "assigned") continue;
    await patchCollectionsParticipantsRecordsId(
      p.id,
      withAudit(
        {
          team: teamId,
          status: "assigned",
        },
        "update",
      ) as unknown as ParticipantsRecord,
    );
  }

  const nextStatus = statusForCount(approved.length, team.status, minReady);
  if (nextStatus) {
    await patchCollectionsTeamsRecordsId(
      teamId,
      withAudit({ status: nextStatus }, "update") as unknown as TeamsRecord,
    );
  }

  return {
    formed: true,
    teamId,
    teamName: team.name?.trim() || teamName,
    memberCount: approved.length,
    createdNew,
  };
}
