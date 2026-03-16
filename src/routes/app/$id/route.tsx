import { createFileRoute, Link, Outlet, useParams, useLocation, redirect, useNavigate } from "@tanstack/react-router";
import { pb } from "@/lib/pocketbase";
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
} from "@/components/ui/sidebar";
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
import {
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeft,
  ShieldCheck,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";
import { useIsMutating } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { usePocketBaseAuth } from "@/hooks/use-pocketbase-auth";
import { useSidebar } from "@/components/ui/sidebar";
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
  const { signOut } = usePocketBaseAuth();
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
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex h-12 items-center gap-2 px-2">
            <MobileSidebarTrigger />
            <SyncIndicator />
            <span className="font-semibold text-sidebar-foreground">
              SK MLBB Tracker
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      render={
                        <Link
                          to={item.to}
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
        <SidebarFooter className="border-t border-sidebar-border">
          <div className="flex flex-col gap-2 px-2 py-2">
            <div className="text-xs text-muted-foreground">Barangay 176-E</div>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={() => setSignOutOpen(true)}
            >
              <LogOut className="size-4" />
              Sign out
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
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
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
    <Spinner
      className="size-4 text-muted-foreground"
      aria-label="Saving..."
    />
  );
}
