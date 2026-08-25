import { pb } from "@/lib/pocketbase";

export const PARTICIPANT_DOC_FIELDS = [
  "school_id_front",
  "school_id_back",
  "purok_endorsement",
] as const;

export type ParticipantDocField = (typeof PARTICIPANT_DOC_FIELDS)[number];

export const PARTICIPANT_DOC_LABELS: Record<ParticipantDocField, string> = {
  school_id_front: "Valid ID / School ID (front)",
  school_id_back: "Valid ID / School ID (back)",
  purok_endorsement: "Purok endorsement (optional)",
};

/** PocketBase record shape needed for `pb.files.getURL`. */
export type ParticipantFileRecord = {
  id: string;
  collectionId?: string;
  collectionName?: string;
};

export function isProbablyPdf(filename: string): boolean {
  return /\.pdf$/i.test(filename) || filename.toLowerCase().includes(".pdf");
}

/**
 * Build an authenticated file URL.
 * PocketHost protected files 404 with Bearer alone — need `pb.files.getToken()`.
 */
export async function getParticipantFileUrl(
  record: ParticipantFileRecord,
  filename: string | undefined | null,
): Promise<string | null> {
  if (!record.id || !filename?.trim()) return null;

  const token = await pb.files.getToken();
  // PocketBase accepts collection name when collectionId is missing.
  return pb.files.getURL(
    {
      id: record.id,
      collectionId: record.collectionId || "participants",
      collectionName: record.collectionName || "participants",
    },
    filename,
    { token },
  );
}

/** Fetch a protected file and return a blob object URL for preview. */
export async function fetchParticipantFileObjectUrl(
  record: ParticipantFileRecord,
  filename: string,
): Promise<{ objectUrl: string; contentType: string; revoke: () => void }> {
  const url = await getParticipantFileUrl(record, filename);
  if (!url) throw new Error("Missing file");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(res.statusText || `Failed to load file (${res.status})`);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  return {
    objectUrl,
    contentType: blob.type || res.headers.get("content-type") || "",
    revoke: () => URL.revokeObjectURL(objectUrl),
  };
}
