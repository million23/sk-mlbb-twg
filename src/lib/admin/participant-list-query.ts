export type ParticipantListStatusTab =
  | "pending"
  | "approved"
  | "rejected"
  | "all";

export function escapePocketBaseFilterValue(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

export function participantListFilter(
  tournamentId: string,
  tab: ParticipantListStatusTab,
  search: string,
): string {
  const id = escapePocketBaseFilterValue(tournamentId);
  const parts = [`tournament = "${id}"`, "archived != true"];
  if (tab !== "all") {
    parts.push(`registration_status = "${tab}"`);
  }
  const q = search.trim();
  if (q) {
    const needle = escapePocketBaseFilterValue(q);
    parts.push(
      `(name ~ "${needle}" || email ~ "${needle}" || ign ~ "${needle}" || user_id ~ "${needle}" || contact_number ~ "${needle}" || registration_status_code ~ "${needle}" || preferred_team_name ~ "${needle}")`,
    );
  }
  return parts.join(" && ");
}
