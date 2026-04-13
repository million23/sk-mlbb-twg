/**
 * Defaults for PocketBase `getFullList` queries shared by admin and public routes.
 * Keeps data warm when switching pages (e.g. /p/tournaments ↔ /p/teams) without
 * remount-triggered refetches. Mutations still call `invalidateQueries` to refresh.
 */
export const pocketbaseListQueryOptions = {
  staleTime: 10 * 60 * 1000,
  gcTime: 45 * 60 * 1000,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
} as const;
