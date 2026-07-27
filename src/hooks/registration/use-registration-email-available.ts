import { customInstance } from "@/lib/api/mutator/custom-instance";
import { registrationKeys } from "@/hooks/registration/query-keys";
import { queryOptions, useQuery } from "@tanstack/react-query";

type EmailAvailableResponse = {
  available: boolean;
};

function pocketBaseOrigin() {
  return (
    import.meta.env.VITE_POCKETHOST_URL?.trim() || "https://pb.sk-mlbb-twg.com"
  ).replace(/\/$/, "");
}

/** Public PB hook route — not under /api/collections. */
export async function fetchRegistrationEmailAvailable(
  tournamentId: string,
  email: string,
): Promise<boolean> {
  const tid = tournamentId.trim();
  const em = email.trim().toLowerCase();
  if (!tid || !em.includes("@")) return true;

  const url = new URL(`${pocketBaseOrigin()}/sk/registration/email-available`);
  url.searchParams.set("tournament", tid);
  url.searchParams.set("email", em);

  const res = await customInstance<EmailAvailableResponse>(url.toString(), {
    method: "GET",
  });
  return res.available !== false;
}

export function registrationEmailAvailableQueryOptions(
  tournamentId: string,
  email: string,
  enabled: boolean,
) {
  const tid = tournamentId.trim();
  const em = email.trim().toLowerCase();
  return queryOptions({
    queryKey: registrationKeys.emailAvailable(tid, em),
    queryFn: () => fetchRegistrationEmailAvailable(tid, em),
    enabled: enabled && Boolean(tid) && em.includes("@"),
    staleTime: 30_000,
  });
}

export function useRegistrationEmailAvailable(
  tournamentId: string,
  email: string,
  enabled: boolean,
) {
  return useQuery(
    registrationEmailAvailableQueryOptions(tournamentId, email, enabled),
  );
}
