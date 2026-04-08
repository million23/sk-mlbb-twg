import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored
      }
      const legacy = localStorage.getItem("mlbb-theme")
      if (legacy === "light" || legacy === "dark") {
        localStorage.setItem(storageKey, legacy)
        return legacy
      }
    } catch {
      /* private mode / SSR */
    }
    return defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    const resolved: "light" | "dark" =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme

    root.classList.add(resolved)
    // Must match :root[data-theme="…"] in styles.css; class alone was not enough when
    // another initializer set data-theme (e.g. legacy mlbb-theme).
    root.setAttribute("data-theme", resolved)
  }, [theme])

  const value = {
    theme,
    setTheme: (next: Theme) => {
      try {
        localStorage.setItem(storageKey, next)
      } catch {
        /* ignore */
      }
      setTheme(next)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}