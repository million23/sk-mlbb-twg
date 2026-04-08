import * as React from "react";

const MOBILE_BREAKPOINT = 768;
/** Match Tailwind `lg`: docked sidebar below this width becomes overlay (tablet portrait). */
const SIDEBAR_OVERLAY_MAX_PX = 1023;

/**
 * Breakpoint match for client-only layout. Initial `false` keeps the first render
 * deterministic (SSR / hydration–safe); effect syncs to the real viewport.
 */
function useMediaMaxWidth(maxWidthPx: number): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
    const onChange = () => {
      setMatches(window.innerWidth <= maxWidthPx);
    };
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, [maxWidthPx]);

  return matches;
}

export function useIsMobile() {
  return useMediaMaxWidth(MOBILE_BREAKPOINT - 1);
}

/** True when the app should use overlay / sheet navigation instead of a fixed sidebar. */
export function useIsMobileSidebar() {
  return useMediaMaxWidth(SIDEBAR_OVERLAY_MAX_PX);
}
