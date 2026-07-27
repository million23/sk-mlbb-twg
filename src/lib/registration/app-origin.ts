/**
 * Public site origin for registration emails (verify links).
 * Prefer the browser origin so local / beta / prod submissions keep the right host.
 */

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function ensureOrigin(hostOrUrl: string): string {
  const raw = hostOrUrl.trim();
  if (!raw) return "";
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return stripTrailingSlash(`${u.protocol}//${u.host}`);
  } catch {
    return "";
  }
}

/** Origins declared in Vite env (deployed hosts). */
export function configuredWebsiteOrigins(): string[] {
  const keys = [
    "VITE_APP_URL",
    "VITE_WEBSITE_URL_MAIN",
    "VITE_WEBSITE_URL_BETA",
  ] as const;
  const out: string[] = [];
  for (const key of keys) {
    const value = import.meta.env[key];
    if (typeof value !== "string") continue;
    const origin = ensureOrigin(value);
    if (origin && !out.includes(origin)) out.push(origin);
  }
  return out;
}

/**
 * Origin of the site that accepted this registration.
 * Uses `window.location.origin` in the browser; falls back to VITE_APP_URL.
 */
export function resolveRegistrationAppOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return stripTrailingSlash(window.location.origin);
  }
  const fromEnv = import.meta.env.VITE_APP_URL;
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    return ensureOrigin(fromEnv);
  }
  return "";
}
