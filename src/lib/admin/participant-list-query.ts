export type ParticipantListStatusTab =
  | "pending"
  | "approved"
  | "rejected"
  | "archived"
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
  const parts = [
    `tournament = "${id}"`,
    tab === "archived" ? "archived = true" : "archived != true",
  ];
  if (tab !== "all" && tab !== "archived") {
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

function escapeIlike(value: string): string {
  return value.replaceAll(/[%_,]/g, " ").replaceAll('"', "").trim();
}

export function participantSearchOrFilter(search: string): string | null {
  const q = escapeIlike(search);
  if (!q) return null;
  const pattern = `%${q}%`;
  return [
    `name.ilike.${pattern}`,
    `email.ilike.${pattern}`,
    `ign.ilike.${pattern}`,
    `user_id.ilike.${pattern}`,
    `contact_number.ilike.${pattern}`,
    `registration_status_code.ilike.${pattern}`,
    `preferred_team_name.ilike.${pattern}`,
  ].join(",");
}
