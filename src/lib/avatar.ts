import { createAvatar } from "@dicebear/core";
import { identicon, lorelei } from "@dicebear/collection";

/**
 * Returns a DiceBear avatar data URI for the given seed (generated locally, no API).
 * @param seed - Unique string (e.g. id, name, email) to generate consistent avatar
 */
export function getAvatarUrl(seed: string): string {
  const avatar = createAvatar(lorelei, { seed: seed || "default" });
  return avatar.toDataUri();
}

/**
 * Returns a DiceBear avatar data URI for teams (identicon style - abstract geometric shapes).
 */
export function getTeamAvatarUrl(seed: string): string {
  const avatar = createAvatar(identicon, { seed: seed || "default" });
  return avatar.toDataUri();
}
