import { asyncRateLimit } from "@tanstack/pacer/async-rate-limiter";

/** Client-side rate limit: 30 requests per minute (sliding window) to stay under PocketBase limits */
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

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
