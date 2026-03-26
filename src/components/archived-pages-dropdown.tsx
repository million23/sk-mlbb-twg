import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  Link,
  type ToPathOption,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Archive,
  Check,
  ChevronDown,
  Swords,
  Trophy,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type ArchivedPageId =
  | "participants"
  | "teams"
  | "tournament"
  | "matches";

const SECTIONS: {
  id: ArchivedPageId;
  label: string;
  to:
    | "/app/$id/participants/archived"
    | "/app/$id/teams/archived"
    | "/app/$id/tournament/archived"
    | "/app/$id/matches/archived";
  icon: LucideIcon;
}[] = [
  {
    id: "participants",
    label: "Participants",
    to: "/app/$id/participants/archived",
    icon: Users,
  },
  {
    id: "teams",
    label: "Teams",
    to: "/app/$id/teams/archived",
    icon: UsersRound,
  },
  {
    id: "tournament",
    label: "Tournaments",
    to: "/app/$id/tournament/archived",
    icon: Trophy,
  },
  {
    id: "matches",
    label: "Matches",
    to: "/app/$id/matches/archived",
    icon: Swords,
  },
];

function resolveArchivedPath(
  to: (typeof SECTIONS)[number]["to"],
  appId: string,
) {
  return to.replace("$id", appId).replace(/\/$/, "");
}

function matchesArchivedPath(pathname: string, to: (typeof SECTIONS)[number]["to"], appId: string) {
  const resolved = resolveArchivedPath(to, appId);
  const p = pathname.replace(/\/$/, "") || "/";
  return p === resolved || p.startsWith(`${resolved}/`);
}

/** Sidebar accordion: expand to jump to archived list pages (participants, teams, tournaments, matches). */
export function SidebarArchivedPagesMenu({
  appId,
  onAfterNavigate,
}: {
  appId: string;
  onAfterNavigate?: () => void;
}) {
  const location = useLocation();
  const pathname = location.pathname;

  const anyActive = SECTIONS.some((s) =>
    matchesArchivedPath(pathname, s.to, appId),
  );

  const [open, setOpen] = useState(anyActive);
  useEffect(() => {
    if (anyActive) setOpen(true);
  }, [anyActive]);

  return (
    <SidebarMenuItem>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          render={
            <SidebarMenuButton
              render={<button type="button" />}
              isActive={anyActive}
              tooltip="Archived"
            >
              <Archive className="size-4" aria-hidden />
              <span>Archived</span>
              <ChevronDown
                className={cn(
                  "ml-auto size-4 opacity-70 transition-transform duration-200",
                  "group-data-[collapsible=icon]:hidden",
                  open && "rotate-180",
                )}
                aria-hidden
              />
            </SidebarMenuButton>
          }
        />
        <CollapsibleContent className="overflow-hidden">
          <SidebarMenuSub>
            <SidebarMenuSubItem className="pointer-events-none px-2 py-1.5 text-xs font-medium text-sidebar-foreground/70">
              Go to archived…
            </SidebarMenuSubItem>
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isSubActive = matchesArchivedPath(pathname, s.to, appId);
              return (
                <SidebarMenuSubItem key={s.id}>
                  <SidebarMenuSubButton
                    render={
                      <Link
                        to={s.to as ToPathOption}
                        params={{ id: appId }}
                        onClick={onAfterNavigate}
                      />
                    }
                    isActive={isSubActive}
                  >
                    <Icon className="size-4" aria-hidden />
                    <span>{s.label}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

export function ArchivedPagesDropdown({
  appId,
  current,
  className,
}: {
  appId: string;
  current: ArchivedPageId;
  className?: string;
}) {
  const navigate = useNavigate();
  const currentLabel =
    SECTIONS.find((s) => s.id === current)?.label ?? "Archived";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn("gap-2", className)}
            aria-label="Switch between archived sections"
          >
            <Archive className="size-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Archived sections</span>
            <span className="truncate sm:hidden">{currentLabel}</span>
            <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Go to archived…</DropdownMenuLabel>
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = s.id === current;
            return (
              <DropdownMenuItem
                key={s.id}
                disabled={isActive}
                onClick={() => {
                  if (isActive) return;
                  void navigate({ to: s.to, params: { id: appId } });
                }}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="flex-1">{s.label}</span>
                {isActive ? (
                  <Check className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
