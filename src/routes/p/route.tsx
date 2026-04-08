import { cn } from "@/lib/utils";
import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { Home, Swords, Trophy, Users, UsersRound } from "lucide-react";

export const Route = createFileRoute("/p")({
  component: PublicShell,
});

const nav = [
  { to: "/p/tournaments" as const, label: "Tournaments", icon: Trophy },
  { to: "/p/matches" as const, label: "Matches", icon: Swords },
  { to: "/p/teams" as const, label: "Teams", icon: UsersRound },
  { to: "/p/participants" as const, label: "Participants", icon: Users },
];

function PublicShell() {
  const pathname = useLocation({ select: (l) => l.pathname });

  return (
    <div className="min-h-svh flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-foreground hover:text-primary"
          >
            <Home className="size-4 opacity-80" aria-hidden />
            <span className="hidden sm:inline">SK MLBB</span>
          </Link>
          <nav className="flex flex-1 flex-wrap items-center gap-1 sm:gap-2">
            {nav.map(({ to, label, icon: Icon }) => {
              const active =
                pathname === to || pathname.startsWith(`${to}/`);
              return (
                <Link key={to} to={to}>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5 opacity-80" aria-hidden />
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
