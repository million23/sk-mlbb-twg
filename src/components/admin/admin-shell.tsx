import { useTheme } from "@/components/theme-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  AdminTournamentSelector,
  resolveAdminTournamentId,
} from "@/components/admin/admin-tournament-selector";
import { Spinner } from "@/components/ui/spinner";
import { usePocketBaseAuth } from "@/hooks/legacy/use-pocketbase-auth";
import { useTournaments } from "@/hooks/legacy/use-tournaments";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
import { useActiveTournamentId } from "@/lib/admin/active-tournament";
import { useAdminRbac } from "@/hooks/admin/use-admin-rbac";
import { queryClient } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { useIsMutating } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import {
  ChevronsUpDown,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  Moon,
  PanelLeft,
  PanelLeftClose,
  ScrollText,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";
import { useState, type ReactNode } from "react";

const platformNavItems = [
  {
    to: "/app" as const,
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: "/app/tournaments" as const,
    label: "Tournaments",
    icon: Trophy,
    exact: true,
  },
];

const committeeNavItems = [
  { to: "/app/admins" as const, label: "Admins", icon: ShieldCheck },
  { to: "/app/audit-logs" as const, label: "Audit log", icon: ScrollText },
];

const tournamentNavItems = [
  {
    to: "/app/tournaments/$tournamentId" as const,
    label: "Overview",
    icon: Trophy,
    exact: true,
  },
  {
    to: "/app/tournaments/$tournamentId/participants" as const,
    label: "Participants",
    icon: Users,
  },
  {
    to: "/app/tournaments/$tournamentId/teams" as const,
    label: "Teams",
    icon: UsersRound,
  },
  {
    to: "/app/tournaments/$tournamentId/team-standing" as const,
    label: "Team Standing",
    icon: ListOrdered,
  },
  {
    to: "/app/tournaments/$tournamentId/matches" as const,
    label: "Matches",
    icon: Swords,
  },
] as const;

function userDisplay(record: unknown) {
  const r = record as { name?: string; email?: string } | null | undefined;
  const name = r?.name?.trim();
  const email = typeof r?.email === "string" ? r.email : "";
  const displayName = name || email || "Signed in";
  const initials = name
    ? name
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
        .slice(0, 2) || "?"
    : email
      ? email.slice(0, 2).toUpperCase()
      : "?";
  return { displayName, email, initials };
}

export function AdminShell({ children }: { children?: ReactNode }) {
  return (
    <SidebarProvider>
      <AdminShellContent>{children}</AdminShellContent>
    </SidebarProvider>
  );
}

function AdminShellContent({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as {
    tournamentId?: string;
  };
  const storedTournamentId = useActiveTournamentId();
  const { data: tournaments } = useTournaments();
  const tournamentIds = (tournaments ?? [])
    .map((t) => t.id)
    .filter((id): id is string => Boolean(id));
  const tournamentId = resolveAdminTournamentId(
    params.tournamentId,
    storedTournamentId,
    tournamentIds,
  );
  const { signOut, record } = usePocketBaseAuth();
  const rbac = useAdminRbac();
  const visiblePlatformNavItems = platformNavItems.filter((item) => {
    if (item.to === "/app") return rbac.canViewDashboard;
    if (item.to === "/app/tournaments") return rbac.canViewTournaments;
    return true;
  });
  const visibleTournamentNavItems = tournamentNavItems.filter((item) => {
    if (item.to === "/app/tournaments/$tournamentId") {
      return rbac.canAccessTournamentOps;
    }
    if (item.to === "/app/tournaments/$tournamentId/participants") {
      return rbac.canViewParticipants;
    }
    if (item.to === "/app/tournaments/$tournamentId/teams") {
      return rbac.canViewTeams;
    }
    if (item.to === "/app/tournaments/$tournamentId/matches") {
      return rbac.canViewMatches;
    }
    if (item.to === "/app/tournaments/$tournamentId/team-standing") {
      return rbac.canViewTeamStanding;
    }
    return rbac.canAccessTournamentOps;
  });
  const visibleCommitteeNavItems = committeeNavItems.filter((item) => {
    if (item.to === "/app/audit-logs") return rbac.canViewAuditLog;
    if (item.to === "/app/admins") return rbac.canViewAdmins;
    return true;
  });
  const {
    setOpenMobile,
    isMobile,
    open: sidebarOpen,
    setOpen: setSidebarOpen,
  } = useSidebar();
  const mutatingCount = useIsMutating();
  const showInsetTopBar = isMobile || mutatingCount > 0;
  const [signOutOpen, setSignOutOpen] = useState(false);

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleSignOut = () => {
    signOut();
    setSignOutOpen(false);
    navigate({ to: "/app/auth/login" });
    queueMicrotask(() => queryClient.clear());
  };

  const isActive = (path: string, exact?: boolean) => {
    const pathNorm = location.pathname.replace(/\/$/, "") || "/";
    const resolved = path
      .replace("$tournamentId", tournamentId)
      .replace(/\/$/, "");
    if (exact) {
      return pathNorm === resolved || (path === "/app" && pathNorm === "/app");
    }
    if (pathNorm === resolved) return true;
    return Boolean(resolved) && pathNorm.startsWith(resolved + "/");
  };

  const { displayName, email, initials } = userDisplay(record);
  const roleLabel =
    rbac.role === "superadmin"
      ? "Superadmin"
      : rbac.role === "staff"
        ? "Staff"
        : null;
  const { setTheme } = useTheme();
  const resolvedTheme = useResolvedTheme();

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="gap-2 border-b border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={
                  <Link
                    to="/app"
                    activeOptions={{ exact: true }}
                    onClick={closeMobileSidebar}
                  />
                }
                isActive={isActive("/app", true)}
                tooltip="SK MLBB Tracker"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Trophy className="size-4" aria-hidden />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    SK MLBB Tracker
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    Admin
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visiblePlatformNavItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      render={
                        <Link
                          to={item.to}
                          activeOptions={{ exact: item.exact === true }}
                          onClick={closeMobileSidebar}
                        />
                      }
                      isActive={isActive(item.to, item.exact === true)}
                      tooltip={item.label}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Tournament</SidebarGroupLabel>
            <SidebarGroupContent className="gap-2">
              <div className="mb-3 px-2 group-data-[collapsible=icon]:hidden">
                <AdminTournamentSelector
                  value={tournamentId}
                  onSelected={closeMobileSidebar}
                />
                {!tournamentId ? (
                  <p className="mt-2 px-0.5 text-muted-foreground text-xs text-pretty">
                    Choose a tournament to unlock overview, roster, and matches.
                  </p>
                ) : null}
              </div>
              <SidebarMenu>
                {tournamentId
                  ? visibleTournamentNavItems.map((item) => (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          render={
                            <Link
                              to={item.to}
                              params={{ tournamentId }}
                              activeOptions={{
                                exact: "exact" in item && item.exact === true,
                              }}
                              onClick={closeMobileSidebar}
                            />
                          }
                          isActive={isActive(
                            item.to,
                            "exact" in item && item.exact === true,
                          )}
                          tooltip={item.label}
                        >
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  : (
                      <SidebarMenuItem className="hidden group-data-[collapsible=icon]:block">
                        <SidebarMenuButton
                          render={<button type="button" />}
                          tooltip="Select a tournament"
                          onClick={() => setSidebarOpen(true)}
                        >
                          <Trophy className="size-4" />
                          <span>Select tournament</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Committee</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleCommitteeNavItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      render={
                        <Link
                          to={item.to}
                          activeOptions={{ exact: true }}
                          onClick={closeMobileSidebar}
                        />
                      }
                      isActive={isActive(item.to)}
                      tooltip={item.label}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu>
            {!isMobile ? (
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<button type="button" />}
                  tooltip={
                    sidebarOpen ? "Minimize sidebar" : "Maximize sidebar"
                  }
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? (
                    <PanelLeftClose className="size-4" aria-hidden />
                  ) : (
                    <PanelLeft className="size-4" aria-hidden />
                  )}
                  <span>
                    {sidebarOpen ? "Minimize sidebar" : "Maximize sidebar"}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : null}
            <SidebarMenuItem className={!isMobile ? "mt-2" : undefined}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      render={<button type="button" />}
                      tooltip={
                        email ? `${displayName} · ${email}` : displayName
                      }
                    >
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {displayName}
                        </span>
                        <span className="truncate text-xs text-sidebar-foreground/70">
                          {roleLabel
                            ? email
                              ? `${roleLabel} · ${email}`
                              : roleLabel
                            : email || "Signed in"}
                        </span>
                      </div>
                      <ChevronsUpDown
                        className="ml-auto size-4 opacity-70"
                        aria-hidden
                      />
                    </SidebarMenuButton>
                  }
                />
                <DropdownMenuContent
                  side="top"
                  align="end"
                  sideOffset={4}
                  className="min-w-48"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuCheckboxItem
                      checked={resolvedTheme === "dark"}
                      onCheckedChange={(checked) => {
                        setTheme(checked ? "dark" : "light");
                      }}
                    >
                      <Moon className="size-4" aria-hidden />
                      Dark mode
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setSignOutOpen(true)}
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be logged out and redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SidebarInset className="overflow-hidden">
        {showInsetTopBar ? (
          <header
            className={cn(
              "relative z-10 flex h-12 shrink-0 items-center border-b border-border bg-background/70 px-4 backdrop-blur-sm",
              isMobile ? "gap-2" : "justify-end",
            )}
          >
            <MobileSidebarTrigger />
            {isMobile ? <div className="min-w-0 flex-1" aria-hidden /> : null}
            <SyncIndicator />
          </header>
        ) : null}
        <div className="relative min-w-0 flex-1 overflow-auto">
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_0%_0%,color-mix(in_oklch,var(--primary)_20%,transparent),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_100%_15%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_40%_100%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_55%)]" />
            <div
              className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              }}
            />
          </div>
          <div className="relative px-4 py-4 md:px-5 md:py-5 lg:px-6 lg:py-6">
            {children ?? <Outlet />}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

function MobileSidebarTrigger() {
  const { setOpenMobile, isMobile } = useSidebar();
  if (!isMobile) return null;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="-ml-1 size-10"
      onClick={() => setOpenMobile(true)}
      aria-label="Open menu"
    >
      <Menu className="size-6" />
    </Button>
  );
}

function SyncIndicator() {
  const isMutating = useIsMutating();
  if (isMutating === 0) return null;
  return (
    <Spinner className="size-4 text-muted-foreground" aria-label="Saving..." />
  );
}
