import { customInstance } from "@/lib/api/mutator/custom-instance";
import { registrationKeys } from "@/hooks/registration/query-keys";
import { queryOptions, useQuery } from "@tanstack/react-query";

export type RegistrationStatusReceipt = {
  registration_status: "pending" | "approved" | "rejected" | string;
  registration_reject_reason: string;
  registration_status_code: string;
  tournament_title: string;
  name: string;
  email: string;
  ign: string;
  birthdate: string;
  contact_number: string;
  user_id: string;
  server_id: string;
  address_phase: string;
  address_package: string;
  address_block: string;
  address_lot: string;
  preferred_lane: string;
  team_intent: string;
  preferred_team_name: string;
  status: string;
  consent_version: string;
  consent_accepted_at: string;
  created: string;
};

type StatusLookupResponse = {
  found: boolean;
  receipt?: RegistrationStatusReceipt;
};

function pocketBaseOrigin() {
  return (
    import.meta.env.VITE_POCKETHOST_URL?.trim() || "https://pb.sk-mlbb-twg.com"
  ).replace(/\/$/, "");
}

export function normalizeStatusCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

export function isValidStatusCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

/** Public PB hook route — not under /api/collections. */
export async function fetchRegistrationStatus(
  code: string,
): Promise<StatusLookupResponse> {
  const normalized = normalizeStatusCode(code);
  if (!isValidStatusCode(normalized)) {
    throw new Error("Enter a valid 6-digit status code");
  }

  const url = new URL(`${pocketBaseOrigin()}/sk/registration/status`);
  url.searchParams.set("code", normalized);

  return customInstance<StatusLookupResponse>(url.toString(), {
    method: "GET",
  });
}

export function registrationStatusQueryOptions(code: string, enabled: boolean) {
  const normalized = normalizeStatusCode(code);
  return queryOptions({
    queryKey: registrationKeys.status(normalized),
    queryFn: () => fetchRegistrationStatus(normalized),
    enabled: enabled && isValidStatusCode(normalized),
    staleTime: 30_000,
    retry: false,
  });
}

export function useRegistrationStatus(code: string, enabled: boolean) {
  return useQuery(registrationStatusQueryOptions(code, enabled));
}
