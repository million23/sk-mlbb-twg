import type { PostgrestError } from "@supabase/supabase-js";

export function throwIfError<T>(result: {
  data: T;
  error: PostgrestError | null;
}): T {
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function iso(value: string | Date | null | undefined): string | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value.toISOString();
  return value;
}
