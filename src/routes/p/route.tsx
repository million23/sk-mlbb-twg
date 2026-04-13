import { PublicFooter } from "@/components/public/public-footer";
import { PublicTeamRosterModalProvider } from "@/components/public/public-team-roster-modal";
import { useParticipants } from "@/hooks/use-participants";
import { useTeams } from "@/hooks/use-teams";
import { useTournaments } from "@/hooks/use-tournaments";
import { PUBLIC_SITE_TITLE } from "@/lib/public-site";
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
  /** Keep list queries subscribed for the whole /p subtree so navigation does not drop observers and GC refetch windows. */
  useTournaments();
  useTeams();
  useParticipants();

  return (
    <PublicTeamRosterModalProvider>
    <div className="relative isolate flex min-h-svh flex-col bg-background bg-linear-to-b from-primary/[0.06] via-background to-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/65">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:min-h-14 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-3 sm:min-w-0 sm:shrink-0">
            <Link
              to="/"
              className="group flex min-h-11 min-w-0 items-center gap-2.5 rounded-xl font-semibold tracking-tight text-foreground transition-colors hover:text-primary sm:min-h-0"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-card/60 text-primary shadow-inner transition-[border-color,box-shadow] group-hover:border-primary/40 group-hover:shadow-[0_0_20px_-6px] group-hover:shadow-primary/35 sm:size-9">
                <Home className="size-4" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="hidden text-xs text-muted-foreground uppercase tracking-wider sm:block">
                  League
                </span>
                <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm sm:text-base">
                  <span className="min-w-0 text-pretty leading-tight sm:leading-snug">
                    {PUBLIC_SITE_TITLE}
                  </span>
                  <span className="font-mono text-[0.6rem] font-normal text-muted-foreground uppercase tracking-[0.16em] sm:hidden">
                    Public
                  </span>
                </span>
              </span>
            </Link>
          </div>
          <nav
            className={cn(
              "border-border/50 border-t pt-3 sm:flex-1 sm:border-t-0 sm:pt-0",
              "grid max-sm:grid-cols-2 max-sm:gap-2",
              "sm:-mx-1 sm:flex sm:flex-nowrap sm:items-stretch sm:gap-2 sm:overflow-x-auto sm:px-1 sm:pb-0.5 sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden",
              "md:justify-end",
            )}
            aria-label="Public sections"
          >
            {nav.map(({ to, label, icon: Icon }) => {
              const active =
                pathname === to || pathname.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className="touch-manipulation max-sm:block sm:shrink-0"
                >
                  <span
                    className={cn(
                      "flex w-full touch-manipulation items-center justify-center gap-2 border text-center transition-[color,background-color,border-color,box-shadow,transform]",
                      "max-sm:min-h-13 max-sm:rounded-xl max-sm:px-2 max-sm:py-2.5 max-sm:text-xs max-sm:leading-snug",
                      "sm:inline-flex sm:h-full sm:rounded-full sm:px-3.5 sm:py-2 sm:text-sm sm:leading-normal",
                      active
                        ? "border-primary/40 bg-primary/15 text-primary shadow-[0_0_24px_-10px] shadow-primary/45 sm:border-primary/35"
                        : "border-border/60 bg-muted/20 text-muted-foreground active:scale-[0.98] sm:border-transparent sm:bg-transparent sm:active:scale-100 sm:hover:border-border sm:hover:bg-muted/80 sm:hover:text-foreground",
                    )}
                  >
                    <Icon
                      className="size-4 shrink-0 opacity-90 max-sm:size-4.5 sm:size-3.5"
                      aria-hidden
                    />
                    <span className="max-sm:line-clamp-2 max-sm:text-pretty sm:whitespace-nowrap">
                      {label}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
        <Outlet />
      </main>
      <PublicFooter siteTitle={PUBLIC_SITE_TITLE} />
    </div>
    </PublicTeamRosterModalProvider>
  );
}
