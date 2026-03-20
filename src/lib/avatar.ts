import { createAvatar } from "@dicebear/core";
import { identicon, lorelei } from "@dicebear/collection";

const avatarCache = new Map<string, string>();
const teamAvatarCache = new Map<string, string>();

/**
 * Returns a DiceBear avatar data URI for the given seed (generated locally, no API).
 * Cached per seed to prevent flicker on re-renders.
 * @param seed - Unique string (e.g. id, name, email) to generate consistent avatar
 */
export function getAvatarUrl(seed: string): string {
  const key = seed || "default";
  let url = avatarCache.get(key);
  if (!url) {
    const avatar = createAvatar(lorelei, { seed: key });
    url = avatar.toDataUri();
    avatarCache.set(key, url);
  }
  return url;
}

/**
 * Returns a DiceBear avatar data URI for teams (identicon style - abstract geometric shapes).
 * Cached per seed to prevent flicker on re-renders.
 */
export function getTeamAvatarUrl(seed: string): string {
  const key = seed || "default";
  let url = teamAvatarCache.get(key);
  if (!url) {
    const avatar = createAvatar(identicon, { seed: key });
    url = avatar.toDataUri();
    teamAvatarCache.set(key, url);
  }
  return url;
}
