import type { Collections } from "@/types/__pocketbase-types";

/** App-side match fields (camelCase) plus snake_case aliases from PocketBase. */
export type MatchWriteInput = Partial<Collections["matches"]> & {
  team_a?: string;
  team_b?: string;
  best_of?: number;
  match_label?: string;
  scheduled_at?: string;
  score_a?: number;
  score_b?: number;
  created_by?: string;
  updated_by?: string;
};

function setIfDefined(
  body: Record<string, unknown>,
  key: string,
  value: unknown,
) {
  if (value !== undefined) body[key] = value;
}

/**
 * PocketBase `matches` fields are snake_case (`best_of`, `team_a`, `archived`).
 * The app uses camelCase. Sending camelCase drops required keys and 400s.
 */
export function toMatchWritePayload(
  data: MatchWriteInput,
  mode: "create" | "update",
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  setIfDefined(body, "tournament", data.tournament);
  setIfDefined(body, "team_a", data.teamA ?? data.team_a);
  setIfDefined(body, "team_b", data.teamB ?? data.team_b);
  setIfDefined(body, "winner", data.winner);
  setIfDefined(body, "bracket", data.bracket);
  setIfDefined(body, "round", data.round);
  setIfDefined(body, "order", data.order);
  setIfDefined(body, "best_of", data.bestOf ?? data.best_of);
  setIfDefined(body, "match_label", data.matchLabel ?? data.match_label);
  setIfDefined(body, "scheduled_at", data.scheduledAt ?? data.scheduled_at);
  setIfDefined(body, "status", data.status);
  setIfDefined(body, "score_a", data.scoreA ?? data.score_a);
  setIfDefined(body, "score_b", data.scoreB ?? data.score_b);
  setIfDefined(body, "notes", data.notes);
  setIfDefined(body, "created_by", data.createdBy ?? data.created_by);
  setIfDefined(body, "updated_by", data.updatedBy ?? data.updated_by);
  setIfDefined(body, "archived", data.archived);

  if (mode === "create") {
    if (body.archived === undefined) body.archived = false;
    if (body.best_of === undefined) body.best_of = 3;
  }

  return body;
}

type TeamExpand = { id?: string; name?: string };

type MatchApiExpand = {
  teamA?: TeamExpand;
  teamB?: TeamExpand;
  winner?: TeamExpand;
  team_a?: TeamExpand;
  team_b?: TeamExpand;
};

/** Copy PocketBase snake_case match fields onto the camelCase keys the UI reads. */
export function fromMatchApiRecord<T extends Record<string, unknown>>(raw: T): T {
  const row = raw as T & {
    teamA?: string;
    teamB?: string;
    team_a?: string;
    team_b?: string;
    matchLabel?: string;
    match_label?: string;
    bestOf?: number;
    best_of?: number;
    scheduledAt?: string;
    scheduled_at?: string;
    scoreA?: number;
    score_a?: number;
    scoreB?: number;
    score_b?: number;
    expand?: MatchApiExpand;
  };
  const expandIn = row.expand;
  return {
    ...row,
    teamA: row.teamA ?? row.team_a,
    teamB: row.teamB ?? row.team_b,
    matchLabel: row.matchLabel ?? row.match_label,
    bestOf: row.bestOf ?? row.best_of,
    scheduledAt: row.scheduledAt ?? row.scheduled_at,
    scoreA: row.scoreA ?? row.score_a,
    scoreB: row.scoreB ?? row.score_b,
    expand: expandIn
      ? {
          ...expandIn,
          teamA: expandIn.teamA ?? expandIn.team_a,
          teamB: expandIn.teamB ?? expandIn.team_b,
          winner: expandIn.winner,
        }
      : expandIn,
  };
}
