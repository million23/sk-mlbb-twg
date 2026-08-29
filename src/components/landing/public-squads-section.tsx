import { PreferredLaneIcons } from "@/components/participants/preferred-lane-icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { PublicRosterTeam } from "@/hooks/public/use-public-roster";
import { UsersRound } from "lucide-react";

type PublicSquadsSectionProps = {
  teams: PublicRosterTeam[];
  isLoading: boolean;
};

export function PublicSquadsSection({
  teams,
  isLoading,
}: PublicSquadsSectionProps) {
  if (isLoading) {
    return (
      <ul className="grid gap-3 sm:grid-cols-2" aria-busy="true">
        {["a", "b", "c", "d"].map((key) => (
          <li key={key}>
            <div className="flex items-center gap-3 rounded-4xl border border-border/80 bg-card/50 p-4">
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <Skeleton className="h-5 min-w-0 flex-1 max-w-44" />
              <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (teams.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyTitle>No teams yet</EmptyTitle>
          <EmptyDescription>
            Assigned squads show here with player names and lanes only.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className="grid items-start gap-3 sm:grid-cols-2">
        {teams.map((team) => (
          <li key={team.id}>
            <Card className="gap-0 overflow-hidden border-border/80 bg-card/50 py-0 transition-[box-shadow,border-color] duration-200 ease-out has-[[data-slot=accordion-trigger]:focus-visible]:ring-2 has-[[data-slot=accordion-trigger]:focus-visible]:ring-ring has-[[data-slot=accordion-trigger]:focus-visible]:ring-offset-2 has-[[data-slot=accordion-trigger]:focus-visible]:ring-offset-background [@media(hover:hover)_and_(pointer:fine)]:hover:border-primary/30 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-lg [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-primary/20">
              <Accordion className="rounded-none border-0">
                <AccordionItem
                  value={team.id}
                  className="border-0 data-open:bg-transparent"
                >
                  <AccordionTrigger className="items-center gap-3 p-4 hover:no-underline">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                      <UsersRound className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-serif text-lg font-semibold">
                      {team.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className="shrink-0 font-mono text-[0.65rem] uppercase tracking-wider"
                    >
                      {team.players.length} player
                      {team.players.length === 1 ? "" : "s"}
                    </Badge>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="border-t border-border/60">
                      {team.players.map((player) => (
                        <li
                          key={player.id}
                          className="flex items-center justify-between gap-3 border-b border-border/50 py-3 last:border-b-0"
                        >
                          <span className="min-w-0 truncate font-medium text-sm">
                            {player.name}
                          </span>
                          <PreferredLaneIcons
                            roles={player.lanes}
                            iconClassName="size-4"
                          />
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </li>
        ))}
    </ul>
  );
}
