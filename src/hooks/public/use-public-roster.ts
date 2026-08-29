import { customInstance } from "@/lib/api/mutator/custom-instance";
import { pocketbaseListQueryOptions } from "@/lib/legacy/pocketbase-list-query-options";
import { queryKeys } from "@/lib/legacy/query-keys";
import type { PlayerRole } from "@/types/__pocketbase-types";
import { useQuery } from "@tanstack/react-query";

export interface PublicRosterPlayer {
  id: string;
  name: string;
  lanes: PlayerRole[];
}

export interface PublicRosterTeam {
  id: string;
  name: string;
  players: PublicRosterPlayer[];
}

type PublicRosterResponse = {
  teams?: {
    id?: string;
    name?: string;
    players?: {
      id?: string;
      name?: string;
      lanes?: unknown;
    }[];
  }[];
};

function pocketBaseOrigin() {
  return (
    import.meta.env.VITE_POCKETHOST_URL?.trim() || "https://pb.sk-mlbb-twg.com"
  ).replace(/\/$/, "");
}

function asLanes(raw: unknown): PlayerRole[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (lane): lane is PlayerRole =>
      lane === "mid" ||
      lane === "gold" ||
      lane === "exp" ||
      lane === "support" ||
      lane === "jungle",
  );
}

export async function fetchPublicRoster(
  tournamentId: string,
): Promise<PublicRosterTeam[]> {
  const tid = tournamentId.trim();
  if (!tid) return [];

  const url = new URL(`${pocketBaseOrigin()}/sk/public/roster`);
  url.searchParams.set("tournament", tid);

  let res: PublicRosterResponse;
  try {
    res = await customInstance<PublicRosterResponse>(url.toString(), {
      method: "GET",
    });
  } catch {
    return [];
  }
  const teams = Array.isArray(res?.teams) ? res.teams : [];
  return teams.flatMap((team) => {
    if (!team?.id || !team.name) return [];
    const players = Array.isArray(team.players) ? team.players : [];
    return [
      {
        id: team.id,
        name: team.name,
        players: players.flatMap((p) => {
          if (!p?.id || !p.name) return [];
          return [{ id: p.id, name: p.name, lanes: asLanes(p.lanes) }];
        }),
      },
    ];
  });
}

export function usePublicRoster(tournamentId: string, enabled: boolean) {
  return useQuery({
    ...pocketbaseListQueryOptions,
    queryKey: queryKeys.publicRoster(tournamentId),
    queryFn: () => fetchPublicRoster(tournamentId),
    enabled: enabled && Boolean(tournamentId.trim()),
  });
}
