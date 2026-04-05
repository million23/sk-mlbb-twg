import { asyncRateLimit } from "@tanstack/pacer/async-rate-limiter";

/**
 * Shared sliding window for every PocketBase call. Quick team / archive bursts plus normal
 * list refetches can spike; too low causes intermittent failures that look like app bugs.
 */
const RATE_LIMIT = 72;
const RATE_WINDOW_MS = 60_000;

const RATE_LIMIT_MESSAGE_SNIPPET = "Rate limit";

/** Single shared rate limiter for all PocketBase API calls */
const execute = asyncRateLimit(
  async <T>(fn: () => Promise<T>): Promise<T> => fn(),
  {
    limit: RATE_LIMIT,
    window: RATE_WINDOW_MS,
    windowType: "sliding",
    onReject: () => {
      throw new Error(
        "Rate limit exceeded. Please wait a moment before trying again."
      );
    },
  }
);

/** Runs an async PocketBase call through the shared rate limiter. Use for mutations and queries. */
export async function rateLimited<T>(fn: () => Promise<T>): Promise<T> {
  return execute(fn) as Promise<T>;
}

/** True when the failure came from {@link rateLimited}'s client-side window (not PocketBase HTTP 429). */
export function isClientRateLimitError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes(RATE_LIMIT_MESSAGE_SNIPPET);
}

/**
 * Like {@link rateLimited}, but retries a few times when our client-side limiter rejects.
 * Use for multi-step flows (e.g. quick team) so a busy window doesn't fail the whole operation.
 */
export async function rateLimitedWithRetry<T>(
  fn: () => Promise<T>,
  options?: { maxAttempts?: number; baseDelayMs?: number },
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 6;
  const baseDelayMs = options?.baseDelayMs ?? 800;
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await rateLimited(fn);
    } catch (e) {
      lastError = e;
      if (!isClientRateLimitError(e) || attempt === maxAttempts - 1) {
        throw e;
      }
      const delay = Math.round(baseDelayMs * Math.pow(1.65, attempt));
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
