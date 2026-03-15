import { persistentAtom } from '@nanostores/persistent'

export type AppTheme = 'light' | 'dark'

export const $theme = persistentAtom<AppTheme>('mlbb-theme', 'dark')

function applyTheme(theme: AppTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.setAttribute('data-theme', theme)
}

export function setTheme(theme: AppTheme): void {
  $theme.set(theme)
}

export function toggleTheme(): void {
  setTheme($theme.get() === 'dark' ? 'light' : 'dark')
}

if (typeof document !== 'undefined') {
  applyTheme($theme.get())
  $theme.listen((nextTheme) => {
    applyTheme(nextTheme)
  })
}

