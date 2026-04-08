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

function PublicTournamentsPage() {
  const { data: tournaments, isLoading, isError, error } = useTournaments();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-8" />
        <p className="text-muted-foreground text-sm">Loading tournaments…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Empty className="min-h-[40vh] border border-dashed">
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Trophy className="size-7 text-primary" aria-hidden />
          Tournaments
        </h1>
        <p className="text-muted-foreground text-sm">
          Active tournaments in Barangay 176-E. Draft events may be visible
          before go-live.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {sorted.map((t) => {
          const start = formatWhen(t.startAt);
          const end = formatWhen(t.endAt);
          return (
            <li key={t.id}>
              <Card className="h-full border-border/80 bg-card/50">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-snug">
                      {tournamentLabel(t)}
                    </CardTitle>
                    <Badge variant="outline" className="shrink-0">
                      {getTournamentStatusLabel(t.status)}
                    </Badge>
                  </div>
                  {t.description ? (
                    <CardDescription className="line-clamp-3">
                      {t.description}
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-2 text-muted-foreground text-sm">
                  {t.venue ? (
                    <p className="flex items-center gap-2">
                      <MapPin className="size-3.5 shrink-0 opacity-70" />
                      {t.venue}
                    </p>
                  ) : null}
                  {start ? <p>Starts {start}</p> : null}
                  {end ? <p>Ends {end}</p> : null}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
