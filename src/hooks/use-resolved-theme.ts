import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";

function readDocumentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Resolves `theme === "system"` to `light` | `dark` using `prefers-color-scheme`. */
export function useResolvedTheme() {
  const { theme } = useTheme();
  const [resolved, setResolved] = useState<"light" | "dark">(readDocumentTheme);

  useEffect(() => {
    if (theme === "light" || theme === "dark") {
      setResolved(theme);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setResolved(mq.matches ? "dark" : "light");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [theme]);

  return resolved;
}
