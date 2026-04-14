import { createRootRoute, Outlet } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { PublicCookieBannerGate } from "@/components/public/public-cookie-banner";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import "../styles.css";

const TanStackDevtoolsMount = import.meta.env.DEV
  ? lazy(() =>
      import("@/components/devtools/tanstack-devtools").then((m) => ({
        default: m.TanStackDevtoolsMount,
      })),
    )
  : () => null;

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const isMobile = useIsMobile();

  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="sk-mlbb-twg-theme">
        <TooltipProvider delay={300}>
          <div className="min-h-dvh bg-background pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]">
            <Outlet />
            <PublicCookieBannerGate />
          </div>
        </TooltipProvider>
        <Toaster richColors position="bottom-center" />
      </ThemeProvider>
      {import.meta.env.DEV && !isMobile && (
        <Suspense fallback={null}>
          <TanStackDevtoolsMount />
        </Suspense>
      )}
    </>
  );
}
