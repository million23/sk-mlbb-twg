import { useEffect, useRef, useState } from "react";

/**
 * Observes when an element enters the viewport (with optional root margin).
 */
export function useInView<T extends Element = HTMLDivElement>(options?: {
  rootMargin?: string;
  threshold?: number | number[];
  enabled?: boolean;
}) {
  const {
    rootMargin = "200px",
    threshold = 0,
    enabled = true,
  } = options ?? {};
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setInView(false);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { rootMargin, threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [enabled, rootMargin, threshold]);

  return { ref, inView };
}
