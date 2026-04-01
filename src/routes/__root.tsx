import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import "../styles.css";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const isMobile = useIsMobile();

  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="sk-mlbb-twg-theme">
        <TooltipProvider delay={200}>
          <div className="min-h-screen bg-background">
            <Outlet />
          </div>
        </TooltipProvider>
        <Toaster richColors position="bottom-right" />
      </ThemeProvider>
      {!isMobile && (
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "TanStack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      )}
    </>
  );
}
