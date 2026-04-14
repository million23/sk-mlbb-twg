import { PublicPageHeader } from "@/components/public/public-page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useTournaments } from "@/hooks/use-tournaments";
import { getTournamentStatusLabel } from "@/lib/tournament-status";
import { tournamentLabel } from "@/lib/tournament-label";
import type { Collections } from "@/types/pocketbase-types";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { MapPin, Trophy } from "lucide-react";

export const Route = createFileRoute("/p/tournaments")({
  component: PublicTournamentsPage,
});

function formatWhen(iso: string | undefined) {
  if (!iso) return null;
  try {
    return format(new Date(iso), "MMM d, yyyy · h:mm a");
  } catch {
    return null;
  }
}

function statusRailClass(
  status: Collections["tournaments"]["status"] | undefined,
) {
  switch (status) {
    case "live":
      return "border-l-primary bg-linear-to-r from-primary/12 to-transparent";
    case "upcoming":
      return "border-l-chart-3 bg-linear-to-r from-chart-3/12 to-transparent";
    case "draft":
      return "border-l-muted-foreground/45 bg-linear-to-r from-muted/35 to-transparent";
    case "completed":
      return "border-l-secondary bg-linear-to-r from-secondary/15 to-transparent";
    case "archived":
      return "border-l-border from-muted/25";
    default:
      return "border-l-border from-transparent";
  }
}

function PublicTournamentsPage() {
  const { data: tournaments, isLoading, isError, error } = useTournaments();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-8 text-primary" />
        <p className="text-muted-foreground text-sm">Loading tournaments…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Empty className="min-h-[40vh] border border-dashed border-destructive/30 bg-destructive/5">
        <EmptyHeader>
          <EmptyTitle>Could not load tournaments</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error ? error.message : "Something went wrong."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const list = tournaments ?? [];

  if (list.length === 0) {
    return (
      <Empty className="min-h-[40vh] border border-dashed">
        <EmptyHeader>
          <EmptyTitle>No tournaments yet</EmptyTitle>
          <EmptyDescription>
            Check back later — events will appear here when published.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const sorted = [...list].sort((a, b) => {
    const order = (s: string | undefined) =>
      s === "live" ? 0 : s === "upcoming" ? 1 : s === "draft" ? 2 : 3;
    return order(a.status) - order(b.status);
  });

  return (
    <div className="flex flex-col gap-10">
      <PublicPageHeader
        eyebrow="Schedule board"
        title="Tournaments"
        description="Active tournaments in Barangay 176-E. Draft events may appear before doors open—status strip shows pulse at a glance."
        icon={Trophy}
      />
      <ul className="grid gap-5 sm:grid-cols-2">
        {sorted.map((t) => {
          const start = formatWhen(t.startAt);
          const end = formatWhen(t.endAt);
          return (
            <li key={t.id}>
              <Card
                className={cn(
                  "h-full overflow-hidden border-border/80 border-l-4 bg-card/55 backdrop-blur-[2px] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/20",
                  statusRailClass(t.status),
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="font-serif text-xl leading-snug sm:text-2xl">
                      {tournamentLabel(t)}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 border-primary/25 font-mono text-[0.65rem] uppercase tracking-wider",
                        t.status === "live" && "border-primary/50 bg-primary/10 text-primary",
                      )}
                    >
                      {getTournamentStatusLabel(t.status)}
                    </Badge>
                  </div>
                  {t.description ? (
                    <CardDescription className="line-clamp-3 text-pretty">
                      {t.description}
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-col gap-2 border-border/50 border-t border-dashed pt-3 text-muted-foreground text-sm">
                  {t.venue ? (
                    <p className="flex items-center gap-2">
                      <MapPin className="size-3.5 shrink-0 text-primary/80" />
                      {t.venue}
                    </p>
                  ) : null}
                  {start ? <p className="font-mono text-xs tracking-wide">Starts {start}</p> : null}
                  {end ? <p className="font-mono text-xs tracking-wide">Ends {end}</p> : null}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
