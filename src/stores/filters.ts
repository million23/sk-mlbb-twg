import { persistentMap } from '@nanostores/persistent'

export const $adminFilters = persistentMap<{
  participantSearch?: string
  teamSearch?: string
  tournamentSearch?: string
  adminSearch?: string
}>('mlbb-admin-filters:', {})

