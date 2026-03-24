/**
 * Age bracket shape (from API or passed in).
 * minAge/maxAge are inclusive. maxAge: null means "and above".
 */
export interface AgeBracketConfig {
  minAge: number;
  maxAge: number | null;
  label: string;
  id?: string;
}

/**
 * Compute age in years from a birthdate string (ISO or YYYY-MM-DD).
 * Returns null if birthdate is invalid or in the future.
 */
export function getAge(birthdate: string | undefined): number | null {
  if (!birthdate?.trim()) return null;
  const date = new Date(birthdate);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  if (date > today) return null;
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

/**
 * Format birthdate for display (e.g. "11/18/2000").
 * Returns null if birthdate is invalid.
 */
export function formatBirthdateDisplay(
  birthdate: string | undefined
): string | null {
  if (!birthdate?.trim()) return null;
  const date = new Date(birthdate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

/**
 * Find the matching bracket for an age.
 * Brackets must be ordered by minAge ascending; first match wins.
 * Returns the bracket config or null if no match or brackets empty.
 */
export function getAgeBracket(
  age: number | null,
  brackets: AgeBracketConfig[]
): AgeBracketConfig | null {
  if (age === null || !brackets?.length) return null;
  const sorted = [...brackets].sort((a, b) => (a.minAge ?? 0) - (b.minAge ?? 0));
  for (const bracket of sorted) {
    const min = bracket.minAge ?? 0;
    const max = bracket.maxAge;
    if (age >= min && (max === null || max === undefined || age <= max)) {
      return bracket;
    }
  }
  return null;
}

/**
 * Get the display label for an age's bracket.
 */
export function getAgeBracketLabel(
  age: number | null,
  brackets: AgeBracketConfig[]
): string {
  const bracket = getAgeBracket(age, brackets);
  return bracket?.label ?? "-";
}

/** Tournament roster: under 18 vs 18+ (unknown birthdate tracked separately). */
export type TournamentAgeGroupKey = "under18" | "18+" | "unknown";

const TOURNAMENT_AGE_LABELS: Record<TournamentAgeGroupKey, string> = {
  under18: "Under 18",
  "18+": "18 and above",
  unknown: "No birthdate",
};

export function tournamentAgeGroupFromBirthdate(
  birthdate: string | undefined
): TournamentAgeGroupKey {
  const age = getAge(birthdate);
  if (age === null) return "unknown";
  if (age < 18) return "under18";
  return "18+";
}

export function tournamentAgeGroupLabel(key: TournamentAgeGroupKey): string {
  return TOURNAMENT_AGE_LABELS[key];
}

export function groupParticipantsByTournamentAge<
  T extends { birthdate?: string },
>(members: T[]): { key: TournamentAgeGroupKey; label: string; items: T[] }[] {
  const buckets: Record<TournamentAgeGroupKey, T[]> = {
    under18: [],
    "18+": [],
    unknown: [],
  };
  for (const m of members) {
    buckets[tournamentAgeGroupFromBirthdate(m.birthdate)].push(m);
  }
  const order: TournamentAgeGroupKey[] = ["under18", "18+", "unknown"];
  return order
    .filter((k) => buckets[k].length > 0)
    .map((key) => ({
      key,
      label: tournamentAgeGroupLabel(key),
      items: buckets[key],
    }));
}

/** One-line counts for team cards / table, e.g. "Under 18: 2 · 18 and above: 3". */
export function summarizeTeamAgeBracketCounts(
  members: { birthdate?: string }[]
): string {
  if (members.length === 0) return "";
  const buckets: Record<TournamentAgeGroupKey, number> = {
    under18: 0,
    "18+": 0,
    unknown: 0,
  };
  for (const m of members) {
    buckets[tournamentAgeGroupFromBirthdate(m.birthdate)]++;
  }
  const parts: string[] = [];
  if (buckets.under18) parts.push(`Under 18: ${buckets.under18}`);
  if (buckets["18+"])
    parts.push(`18 and above: ${buckets["18+"]}`);
  if (buckets.unknown) parts.push(`No birthdate: ${buckets.unknown}`);
  return parts.join(" · ");
}
