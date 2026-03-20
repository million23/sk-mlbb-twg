/**
 * True if each character of needle appears in order in haystack (case-insensitive).
 * Skips spaces in needle. Helps short typos / partial typing (e.g. "mnl" → "Manila").
 */
function isOrderedSubsequence(haystack: string, needle: string): boolean {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase().replace(/\s+/g, "");
  if (n.length === 0) return true;
  let i = 0;
  for (let j = 0; j < n.length; j++) {
    const c = n.charAt(j);
    const idx = h.indexOf(c, i);
    if (idx === -1) return false;
    i = idx + 1;
  }
  return true;
}

/**
 * Fuzzy match: substring first, then per-token substring or ordered subsequence.
 * Multiple space-separated tokens must all match the same combined haystack.
 */
export function matchesFuzzyQuery(haystack: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const h = haystack.toLowerCase();
  if (h.includes(q)) return true;
  const words = q.split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (h.includes(w)) continue;
    if (!isOrderedSubsequence(h, w)) return false;
  }
  return true;
}

/** Build one string from participant fields for cross-field search (e.g. name + area). */
export function participantSearchHaystack(fields: {
  name?: string;
  gameID?: string;
  area?: string;
}): string {
  return [fields.name, fields.gameID, fields.area]
    .filter(Boolean)
    .join(" ");
}
