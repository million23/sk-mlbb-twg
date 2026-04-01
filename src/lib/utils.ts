import { sanitizePhilippineMobileInput } from "@/lib/philippine-mobile";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** First letter of each whitespace-separated word uppercased, rest lowercased. */
export function toTitleCaseWords(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed
    .split(/\s+/)
    .map((word) =>
      word.length === 0
        ? ""
        : word[0].toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

/** Title case for UI (fixes ALL CAPS and inconsistent casing from older records). */
export function formatParticipantNameDisplay(
  value: string | undefined | null,
): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  return toTitleCaseWords(v);
}

/** Apply title case to participant name fields on create. */
export function normalizeParticipantNamesForCreate<
  T extends { name?: string; area?: string },
>(data: T): T {
  const out = { ...data };
  if (typeof out.name === "string") out.name = toTitleCaseWords(out.name);
  if (typeof out.area === "string") out.area = toTitleCaseWords(out.area);
  return out;
}

/** Names + area + contact for PocketBase create (single source of truth for POST). */
export function normalizeParticipantForCreate<
  T extends { name?: string; area?: string; contactNumber?: string },
>(data: T): T {
  const out = normalizeParticipantNamesForCreate(data);
  if (typeof out.contactNumber === "string") {
    out.contactNumber = sanitizePhilippineMobileInput(out.contactNumber);
  }
  return out;
}

/** Normalize contact on update when the field is present. */
export function normalizeParticipantContactIfPresent<
  T extends { contactNumber?: string },
>(data: T): T {
  const out = { ...data };
  if (typeof out.contactNumber === "string") {
    out.contactNumber = sanitizePhilippineMobileInput(out.contactNumber);
  }
  return out;
}
