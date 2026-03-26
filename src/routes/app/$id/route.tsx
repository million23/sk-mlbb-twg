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
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { SidebarArchivedPagesMenu } from "@/components/archived-pages-dropdown";
import { usePocketBaseAuth } from "@/hooks/use-pocketbase-auth";
import { canViewAuditLog } from "@/lib/admin-permissions";
import { pb } from "@/lib/pocketbase";
import { queryClient } from "@/lib/query-client";
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
  LogOut,
  Menu,
  Moon,
  ScrollText,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";

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
  { to: "/app/$id/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/$id/participants", label: "Participants", icon: Users },
  { to: "/app/$id/teams", label: "Teams", icon: UsersRound },
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

/** Resolves `system` theme to light/dark for the menu toggle. */
function useResolvedTheme() {
  const { theme } = useTheme();
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

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
  const { setOpenMobile, isMobile } = useSidebar();
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
    if (path === "/app/$id/") return pathNorm === `/app/${id}`;
    return pathNorm === resolved || pathNorm.startsWith(resolved + "/");
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
                    to="/app/$id/"
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
                  <span className="truncate font-semibold">SK MLBB Tracker</span>
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
                          activeOptions={{ exact: item.to === "/app/$id/" }}
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
                      activeOptions={{ exact: item.to === "/app/$id/" }}
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
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      render={<button type="button" />}
                      tooltip={
                        email
                          ? `${displayName} · ${email}`
                          : displayName
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
                  <DropdownMenuCheckboxItem
                    checked={resolvedTheme === "dark"}
                    onCheckedChange={(checked) => {
                      setTheme(checked ? "dark" : "light");
                    }}
                  >
                    <Moon className="size-4" aria-hidden />
                    Dark mode
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setSignOutOpen(true)}
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
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
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          <MobileSidebarTrigger />
          <SidebarTrigger className="hidden md:flex" />
          <SyncIndicator />
        </header>
        <div className="min-w-0 flex-1 overflow-auto p-4 md:p-6">
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
