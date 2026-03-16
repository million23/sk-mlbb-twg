const DICEBEAR_BASE = "https://api.dicebear.com/9.x";
const DEFAULT_STYLE = "lorelei";

/**
 * Returns a DiceBear avatar URL for the given seed.
 * @param seed - Unique string (e.g. id, name, email) to generate consistent avatar
 * @param style - DiceBear style (lorelei, avataaars, pixel-art, etc.)
 */
export function getAvatarUrl(
  seed: string,
  style: string = DEFAULT_STYLE
): string {
  const encoded = encodeURIComponent(seed || "default");
  return `${DICEBEAR_BASE}/${style}/svg?seed=${encoded}`;
}
