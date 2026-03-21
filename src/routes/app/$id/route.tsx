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
  useSidebar,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeft,
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

const navItems = [
  { to: "/app/$id/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/$id/participants", label: "Participants", icon: Users },
  { to: "/app/$id/teams", label: "Teams", icon: UsersRound },
  { to: "/app/$id/tournament", label: "Tournament", icon: Trophy },
  { to: "/app/$id/matches", label: "Matches", icon: Swords },
  { to: "/app/$id/audit-logs", label: "Audit log", icon: ScrollText },
  { to: "/app/$id/admins", label: "Admins", icon: ShieldCheck },
] as const;

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
  const visibleNavItems = navItems.filter(
    (item) =>
      item.to !== "/app/$id/audit-logs" ||
      canViewAuditLog(record as { role?: string }),
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

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="gap-0 border-b border-border p-0">
          <div className="flex h-12 shrink-0 items-center gap-2 px-4">
            <MobileSidebarTrigger />
            <SyncIndicator />
            <span className="max-w-48 truncate font-semibold tracking-tight text-sidebar-foreground transition-[opacity,max-width] duration-250 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
              SK MLBB Tracker
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-4 py-3">
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleNavItems.map((item) => (
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-border">
          <div className="flex min-w-0 flex-col gap-2 px-4 py-3">
            <Tooltip>
              <TooltipTrigger
                render={
                  <div className="max-w-48 truncate text-xs text-muted-foreground transition-[opacity,max-width] duration-250 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
                    {(record as { name?: string } | null)?.name ?? "Signed in"}
                  </div>
                }
              />
              <TooltipContent side="right" sideOffset={8}>
                {(record as { name?: string } | null)?.name ?? "Signed in"}
              </TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={() => setSignOutOpen(true)}
            >
              <LogOut className="size-4" />
              <span className="max-w-24 overflow-hidden transition-[opacity,max-width] duration-250 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
                Sign out
              </span>
            </Button>
          </div>
        </SidebarFooter>
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
  const { toggleSidebar, isMobile } = useSidebar();
  return (
    <Button
      variant="ghost"
      size={isMobile ? "icon" : "icon-sm"}
      className="-ml-1 size-10 md:size-8"
      onClick={toggleSidebar}
      aria-label="Toggle menu"
    >
      {isMobile ? (
        <Menu className="size-6" />
      ) : (
        <PanelLeft className="size-4" />
      )}
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
