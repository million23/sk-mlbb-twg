import { SidebarArchivedPagesMenu } from "@/components/archived-pages-dropdown";
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
import { Spinner } from "@/components/ui/spinner";
import { usePocketBaseAuth } from "@/hooks/use-pocketbase-auth";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
import { canViewAuditLog } from "@/lib/admin-permissions";
import { pb } from "@/lib/pocketbase";
import { queryClient } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { useIsMutating } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  type ToPathOption,
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
import { useState } from "react";

export const Route = createFileRoute("/app/$id")({
  component: AdminLayout,
  beforeLoad: ({ params }) => {
    if (typeof window !== "undefined" && !pb.authStore.isValid) {
      throw redirect({ to: "/app/auth/login" });
    }
    const id = (params as { id?: string })?.id;
    const recordId = pb.authStore.record?.id;
    if (id && recordId && id !== recordId) {
      throw redirect({ to: "/app/$id/", params: { id: recordId } } as never);
    }
  },
});

const primaryNavItems = [
  { to: "/app/$id", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/$id/participants", label: "Participants", icon: Users },
  { to: "/app/$id/teams", label: "Teams", icon: UsersRound },
  { to: "/app/$id/team-standing", label: "Team Standing", icon: ListOrdered },
  { to: "/app/$id/tournament", label: "Tournament", icon: Trophy },
  { to: "/app/$id/matches", label: "Matches", icon: Swords },
] as const;

/** Above the user menu in the sidebar footer. */
const footerNavItems = [
  { to: "/app/$id/audit-logs", label: "Audit log", icon: ScrollText },
  { to: "/app/$id/admins", label: "Admins", icon: ShieldCheck },
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

function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminLayoutContent />
    </SidebarProvider>
  );
}

function AdminLayoutContent() {
  const params = useParams({ strict: false });
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, record } = usePocketBaseAuth();
  const canAudit = canViewAuditLog(record as { role?: string });
  const visibleFooterNavItems = footerNavItems.filter(
    (item) => item.to !== "/app/$id/audit-logs" || canAudit,
  );
  const {
    setOpenMobile,
    isMobile,
    open: sidebarOpen,
    setOpen: setSidebarOpen,
  } = useSidebar();
  const mutatingCount = useIsMutating();
  const showInsetTopBar = isMobile || mutatingCount > 0;
  const [signOutOpen, setSignOutOpen] = useState(false);
  const id = (params as { id?: string })?.id ?? "main";

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleSignOut = () => {
    signOut();
    setSignOutOpen(false);
    navigate({ to: "/app/auth/login" });
    // Clear cache after navigation so queries unmount first; prevents stale state on re-login
    queueMicrotask(() => queryClient.clear());
  };

  const isActive = (path: string) => {
    const resolved = path.replace("$id", id).replace(/\/$/, "");
    const pathNorm = location.pathname.replace(/\/$/, "") || "/";
    if (path === "/app/$id" || path === "/app/$id/") {
      return pathNorm === `/app/${id}`;
    }
    if (pathNorm === resolved) return true;
    const isArchivedPath = /\/archived(?:\/|$)/.test(pathNorm);
    const primaryWithArchivedPages = new Set([
      "/app/$id/participants",
      "/app/$id/teams",
      "/app/$id/tournament",
      "/app/$id/matches",
    ]);
    if (isArchivedPath && primaryWithArchivedPages.has(path)) return false;
    return pathNorm.startsWith(resolved + "/");
  };

  const { displayName, email, initials } = userDisplay(record);
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
                    to="/app/$id"
                    params={{ id }}
                    activeOptions={{ exact: true }}
                    onClick={closeMobileSidebar}
                  />
                }
                isActive={isActive("/app/$id/")}
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
                <ChevronsUpDown
                  className="ml-auto size-4 opacity-70"
                  aria-hidden
                />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {primaryNavItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      render={
                        <Link
                          to={item.to as ToPathOption}
                          params={{ id }}
                          activeOptions={{ exact: item.to === "/app/$id" }}
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
                <SidebarArchivedPagesMenu
                  appId={id}
                  onAfterNavigate={closeMobileSidebar}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu>
            {visibleFooterNavItems.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  render={
                    <Link
                      to={item.to as ToPathOption}
                      params={{ id }}
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
            <SidebarMenuItem>
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
                        {email ? (
                          <span className="truncate text-xs text-sidebar-foreground/70">
                            {email}
                          </span>
                        ) : null}
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

      <SidebarInset>
        {showInsetTopBar ? (
          <header
            className={cn(
              "flex h-12 shrink-0 items-center border-b border-border px-4",
              isMobile ? "gap-2" : "justify-end",
            )}
          >
            <MobileSidebarTrigger />
            {isMobile ? <div className="min-w-0 flex-1" aria-hidden /> : null}
            <SyncIndicator />
          </header>
        ) : null}
        <div className="min-w-0 flex-1 overflow-auto px-4 py-4 md:px-5 md:py-5 lg:px-6 lg:py-6">
          <Outlet />
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
