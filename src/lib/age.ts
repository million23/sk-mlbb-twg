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
