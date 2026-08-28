import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type { TeamsRecord } from "@/hooks/orval/model/teamsRecord";
import type { TeamsRecordStatus } from "@/hooks/orval/model/teamsRecordStatus";
import { getAuthRecordId } from "@/lib/legacy/mutation-authors";
import { supabase } from "@/lib/supabase/client";
import { throwIfError } from "@/lib/supabase/errors";
import {
  PARTICIPANT_EMBED,
  TEAM_EMBED,
  mapParticipantRow,
  mapTeamRow,
} from "@/lib/supabase/map-records";

export type EnsureCreateTeamResult =
  | { formed: false; reason: "not_create_team" | "missing_name" | "still_pending" | "no_approved" }
  | {
      formed: true;
      teamId: string;
      teamName: string;
      memberCount: number;
      createdNew: boolean;
    };

export type EnsureJoinTeamResult =
  | {
      assigned: false;
      reason: "not_join_team" | "missing_team" | "team_not_found" | "missing_participant";
    }
  | {
      assigned: true;
      teamId: string;
      teamName: string;
      alreadyAssigned: boolean;
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

export function nameKey(raw: string | undefined | null): string {
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

export type CreateTeamCohortPeer = {
  id?: string;
  preferred_team_name?: string | null;
  registration_status?: string | null;
  created?: string;
};

export type CreateTeamFormationGate =
  | { ready: false; reason: "still_pending" | "no_approved" }
  | { ready: true; approved: CreateTeamCohortPeer[] };

/** Pure gate: assign roster only when no pending peers remain for this name. */
export function createTeamFormationGate(
  peersForName: CreateTeamCohortPeer[],
): CreateTeamFormationGate {
  const active = peersForName.filter(
    (p) =>
      p.registration_status === "pending" ||
      p.registration_status === "approved",
  );
  if (active.some((p) => p.registration_status === "pending")) {
    return { ready: false, reason: "still_pending" };
  }
  const approved = active
    .filter((p) => p.registration_status === "approved")
    .sort((a, b) => (a.created ?? "").localeCompare(b.created ?? ""));
  if (approved.length === 0) {
    return { ready: false, reason: "no_approved" };
  }
  return { ready: true, approved };
}

/** Prefer preferred_team id (set at register), else match by name. */
export function resolveCreateTeamRecord(
  teams: TeamsRecord[],
  preferredTeamId: string | undefined | null,
  preferredNameKey: string,
): TeamsRecord | undefined {
  const byId = preferredTeamId?.trim();
  if (byId) {
    const hit = teams.find((t) => t.id === byId);
    if (hit) return hit;
  }
  return teams.find((t) => nameKey(t.name) === preferredNameKey);
}

/** Pure precheck before network assign for join_team approve. */
export function planJoinTeamAssign(participant: {
  team_intent?: string | null;
  id?: string;
  preferred_team?: string | null;
  team?: string | null;
  status?: string | null;
}):
  | Extract<EnsureJoinTeamResult, { assigned: false }>
  | Extract<EnsureJoinTeamResult, { assigned: true }>
  | { proceed: true; participantId: string; teamId: string } {
  if (participant.team_intent !== "join_team") {
    return { assigned: false, reason: "not_join_team" };
  }
  const participantId = participant.id?.trim() ?? "";
  if (!participantId) {
    return { assigned: false, reason: "missing_participant" };
  }
  const teamId = participant.preferred_team?.trim() ?? "";
  if (!teamId) {
    return { assigned: false, reason: "missing_team" };
  }
  if (participant.team === teamId && participant.status === "assigned") {
    return {
      assigned: true,
      teamId,
      teamName: "",
      alreadyAssigned: true,
    };
  }
  return { proceed: true, participantId, teamId };
}

/**
 * After approving a join-team registrant: assign them to preferred_team.
 * Registration only stores the preference; roster assign happens on approve.
 */
export async function ensureJoinTeamAfterApprove(input: {
  tournamentId: string;
  participant: ParticipantsRecord;
  minReady?: number;
}): Promise<EnsureJoinTeamResult> {
  const { tournamentId, participant, minReady = 5 } = input;
  const plan = planJoinTeamAssign(participant);
  if ("assigned" in plan) return plan;

  const { participantId, teamId } = plan;
  const teamRow = throwIfError(
    await supabase
      .from("teams")
      .select(TEAM_EMBED)
      .eq("id", teamId)
      .eq("tournament", tournamentId)
      .eq("archived", false)
      .maybeSingle(),
  );
  if (!teamRow) {
    return { assigned: false, reason: "team_not_found" };
  }
  const team = mapTeamRow(teamRow as Record<string, unknown>);

  throwIfError(
    await supabase
      .from("participants")
      .update(
        withAudit(
          {
            team: teamId,
            status: "assigned",
          },
          "update",
        ) as never,
      )
      .eq("id", participantId),
  );

  const members = throwIfError(
    await supabase
      .from("participants")
      .select("id")
      .eq("tournament", tournamentId)
      .eq("archived", false)
      .eq("team", teamId)
      .eq("status", "assigned"),
  );
  const memberCount = members?.length ?? 0;
  const nextStatus = statusForCount(memberCount, team.status, minReady);
  if (nextStatus) {
    throwIfError(
      await supabase
        .from("teams")
        .update(withAudit({ status: nextStatus }, "update") as never)
        .eq("id", teamId),
    );
  }

  return {
    assigned: true,
    teamId,
    teamName: team.name?.trim() || teamId,
    alreadyAssigned: false,
  };
}

/**
 * After approving a create-team registrant: if every peer with the same
 * preferred team name is approved (none still pending), reuse the forming
 * team (created at register) and assign all approved members.
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

  const peerRows = throwIfError(
    await supabase
      .from("participants")
      .select(PARTICIPANT_EMBED)
      .eq("tournament", tournamentId)
      .eq("archived", false)
      .eq("team_intent", "create_team"),
  );
  const peers = (peerRows ?? [])
    .map((row) => mapParticipantRow(row as Record<string, unknown>))
    .filter((p) => nameKey(p.preferred_team_name) === key);

  const gate = createTeamFormationGate(peers);
  if (!gate.ready) {
    return { formed: false, reason: gate.reason };
  }
  const approved = gate.approved as ParticipantsRecord[];

  const teamRows = throwIfError(
    await supabase
      .from("teams")
      .select(TEAM_EMBED)
      .eq("tournament", tournamentId)
      .eq("archived", false),
  );
  const teams = (teamRows ?? []).map((row) =>
    mapTeamRow(row as Record<string, unknown>),
  );
  let team = resolveCreateTeamRecord(
    teams,
    participant.preferred_team,
    key,
  );
  let createdNew = false;

  if (!team?.id) {
    const status =
      statusForCount(approved.length, undefined, minReady) ?? "forming";
    team = mapTeamRow(
      throwIfError(
        await supabase
          .from("teams")
          .insert(
            withAudit(
              {
                tournament: tournamentId,
                name: teamName,
                status,
                archived: false,
                ...(approved[0]?.id ? { captain: approved[0].id } : {}),
              },
              "create",
            ) as never,
          )
          .select(TEAM_EMBED)
          .single(),
      ) as Record<string, unknown>,
    );
    createdNew = true;
  }

  const teamId = team.id;
  if (!teamId) {
    return { formed: false, reason: "no_approved" };
  }

  for (const p of approved) {
    if (!p.id) continue;
    if (p.team === teamId && p.status === "assigned") continue;
    throwIfError(
      await supabase
        .from("participants")
        .update(
          withAudit(
            {
              team: teamId,
              status: "assigned",
            },
            "update",
          ) as never,
        )
        .eq("id", p.id),
    );
  }

  const nextStatus = statusForCount(approved.length, team.status, minReady);
  const captainId = team.captain || approved[0]?.id || "";
  const patch: Record<string, unknown> = {};
  if (nextStatus) patch.status = nextStatus;
  if (!team.captain && captainId) patch.captain = captainId;
  if (Object.keys(patch).length > 0) {
    throwIfError(
      await supabase
        .from("teams")
        .update(withAudit(patch, "update") as never)
        .eq("id", teamId),
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

/**
 * After reject: if a registration-created forming team has no remaining
 * pending/approved peers and no assigned members, archive it.
 */
export async function maybeArchiveEmptyCreateTeam(input: {
  tournamentId: string;
  participant: ParticipantsRecord;
}): Promise<{ archived: boolean; teamId?: string }> {
  const { tournamentId, participant } = input;
  if (participant.team_intent !== "create_team") {
    return { archived: false };
  }
  const teamId = participant.preferred_team?.trim();
  if (!teamId) return { archived: false };

  const peerRows = throwIfError(
    await supabase
      .from("participants")
      .select("*")
      .eq("tournament", tournamentId)
      .eq("archived", false)
      .or(`preferred_team.eq.${teamId},team.eq.${teamId}`),
  );
  const peers = (peerRows ?? []).map((row) =>
    mapParticipantRow(row as Record<string, unknown>),
  );
  const stillActive = peers.some(
    (p) =>
      p.id !== participant.id &&
      (p.registration_status === "pending" ||
        p.registration_status === "approved" ||
        p.status === "assigned"),
  );
  if (stillActive) return { archived: false };

  const teamRow = throwIfError(
    await supabase
      .from("teams")
      .select("id")
      .eq("id", teamId)
      .eq("archived", false)
      .maybeSingle(),
  );
  if (!teamRow?.id) return { archived: false };

  throwIfError(
    await supabase
      .from("teams")
      .update(withAudit({ archived: true }, "update") as never)
      .eq("id", teamRow.id),
  );
  return { archived: true, teamId: teamRow.id };
}
