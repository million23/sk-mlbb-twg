import { persistentAtom } from "@nanostores/persistent";
import { useStore } from "@nanostores/react";

/** Last tournament workspace opened in the new admin shell. */
export const activeTournamentIdAtom = persistentAtom<string>(
  "sk-mlbb-twg:active-tournament-id",
  "",
);

export function setActiveTournamentId(id: string | undefined) {
  const next = id?.trim() ?? "";
  if (next) activeTournamentIdAtom.set(next);
}

export function useActiveTournamentId() {
  return useStore(activeTournamentIdAtom);
}
