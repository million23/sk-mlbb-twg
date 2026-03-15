import { persistentJSON } from '@nanostores/persistent'
import { computed } from 'nanostores'

import type { AdminAccount } from '@/types/domain'

export interface AuthSession {
  admin: AdminAccount | null
}

export const $authSession = persistentJSON<AuthSession>('mlbb-auth-session', {
  admin: null,
})

export const $isAuthenticated = computed(
  $authSession,
  (session) => Boolean(session.admin)
)

export function setAuthAdmin(admin: AdminAccount | null): void {
  $authSession.set({ admin })
}

export function getAuthAdmin(): AdminAccount | null {
  return $authSession.get().admin
}

