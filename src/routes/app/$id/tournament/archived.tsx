import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { toast } from "sonner";
import { ArchivedPagesDropdown } from "@/components/archived-pages-dropdown";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FxArchivedListTwoRows } from "@/lib/loading-placeholders";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useArchivedTournaments,
  useTournamentMutations,
} from "@/hooks/use-tournaments";
import { getTournamentStatusLabel } from "@/lib/tournament-status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/$id/tournament/archived")({
  component: ArchivedTournamentsPage,
});

function formatArchivedAt(iso?: string) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM d, yyyy HH:mm");
  } catch {
    return iso;
  }
}

function ArchivedTournamentsPage() {
  const params = useParams({ strict: false });
  const id = (params as { id?: string })?.id ?? "";
  const { data: archivedTournaments, isLoading } = useArchivedTournaments();
  const mutations = useTournamentMutations();

  const handleRestore = (tournamentId: string) => {
    mutations.restore.mutate(tournamentId);
    toast.success("Tournament restored");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex flex-col gap-1">
          <Link
            to="/app/$id/tournament"
            params={{ id }}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 gap-2",
            )}
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            Back to tournaments
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Archived tournaments
          </h1>
          <p className="text-muted-foreground">
            Soft-deleted records. Archived time uses last modified (
            <code className="text-xs">updated</code>).
          </p>
        </div>
        <ArchivedPagesDropdown appId={id} current="tournament" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-muted-foreground" />
            Archived list
          </CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading…"
              : `${archivedTournaments?.length ?? 0} archived`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="block bg-transparent p-0 shadow-none ring-0">
              <FxArchivedListTwoRows />
            </Skeleton>
          ) : !archivedTournaments?.length ? (
            <p className="text-sm text-muted-foreground">
              No archived tournaments.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Archived (last modified)</TableHead>
                    <TableHead className="w-[120px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedTournaments.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        {t.title ?? t.id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTournamentStatusLabel(t.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums text-sm">
                        {formatArchivedAt(t.updated)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleRestore(t.id)}
                        >
                          <RotateCcw className="size-4" />
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
