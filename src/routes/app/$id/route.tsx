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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Trophy,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePocketBaseAuth } from "@/hooks/use-pocketbase-auth";

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
  const params = useParams({ strict: false });
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = usePocketBaseAuth();
  const id = (params as { id?: string })?.id ?? "main";

  const handleSignOut = () => {
    signOut();
    navigate({ to: "/app/auth/login" });
  };

  const isActive = (path: string) => {
    const resolved = path.replace("$id", id).replace(/\/$/, "");
    const pathNorm = location.pathname.replace(/\/$/, "") || "/";
    if (path === "/app/$id/") return pathNorm === `/app/${id}`;
    return pathNorm === resolved || pathNorm.startsWith(resolved + "/");
  };

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex h-12 items-center gap-2 px-2">
            <SidebarTrigger />
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
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
