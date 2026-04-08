import { Badge } from "@/components/ui/badge";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  CardDescription,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/participants/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  AUDIT_LOG_ACTIONS_CELL_CLASS,
  AUDIT_LOG_ACTIONS_HEAD_CLASS,
} from "@/components/tables/audit-log-columns";
import { User, UsersRound } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

/** Static loading placeholders (`bg-muted` blocks) wrapped with `animate-pulse` while data loads. */

export function FxAppCardBodyLg() {
  return <div className="h-64 w-full rounded-lg bg-muted" />;
}

export function FxAppMatchesTournamentSelect() {
  return <div className="h-9 w-full max-w-sm rounded-md bg-muted" />;
}

export function FxAppMatchesList() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 w-full rounded-lg bg-muted" />
      ))}
    </div>
  );
}

export function FxArchivedListTwoRows() {
  return (
    <div className="space-y-2">
      <div className="h-10 w-full rounded-md bg-muted" />
      <div className="h-10 w-full rounded-md bg-muted" />
    </div>
  );
}

export function FxAuditDetailRelated() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-full rounded-md bg-muted" />
      <div className="h-4 w-full rounded-md bg-muted" />
      <div className="h-4 w-3/4 rounded-md bg-muted" />
    </div>
  );
}

export function FxDashboardStat() {
  return (
    <>
      <div className="h-8 w-16 rounded-md bg-muted" />
      <CardDescription className="mt-1">Sample description</CardDescription>
    </>
  );
}

const fxChartConfig = {
  count: {
    label: "Registered",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const fxChartData = [
  { label: "Mon", count: 2 },
  { label: "Tue", count: 5 },
  { label: "Wed", count: 3 },
  { label: "Thu", count: 8 },
  { label: "Fri", count: 4 },
  { label: "Sat", count: 6 },
  { label: "Sun", count: 1 },
];

export function FxDashboardChart() {
  return (
    <ChartContainer
      config={fxChartConfig}
      className="aspect-auto h-[220px] w-full"
    >
      <LineChart
        data={fxChartData}
        margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          allowDecimals={false}
          width={36}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="grid min-w-40 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-2 text-xs shadow-xl">
                <span className="font-medium">Sample day</span>
                <span className="tabular-nums">{payload[0]?.value as number}</span>
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="var(--color-count)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

function FxRecentParticipantRow() {
  return (
    <div className="flex min-w-0 items-center gap-3 px-3 py-3">
      <div className="flex size-10 min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60">
        <User className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-medium text-sm">Sample Player</p>
        <p className="truncate text-muted-foreground font-mono text-xs">
          123456789
        </p>
      </div>
      <StatusBadge status="assigned" className="shrink-0 font-normal" />
    </div>
  );
}

export function FxDashboardRecentParticipants() {
  return (
    <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
      {[1, 2, 3, 4, 5].map((i) => (
        <FxRecentParticipantRow key={i} />
      ))}
    </div>
  );
}

function FxRecentTeamRow() {
  return (
    <div className="flex min-w-0 items-center gap-3 px-3 py-3">
      <div className="flex size-10 min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60">
        <UsersRound className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-medium text-sm">Team Alpha</p>
        <p className="text-muted-foreground text-xs">5 members</p>
      </div>
      <Badge variant="outline" className="shrink-0 font-normal">
        Open
      </Badge>
    </div>
  );
}

export function FxDashboardRecentTeams() {
  return (
    <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
      {[1, 2, 3, 4, 5].map((i) => (
        <FxRecentTeamRow key={i} />
      ))}
    </div>
  );
}

export function FxAuditSearch() {
  return (
    <div className="relative mt-2" aria-hidden>
      <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2">
        <div className="size-4 rounded-sm bg-muted" />
      </div>
      <div className="h-10 w-full rounded-md bg-muted" />
    </div>
  );
}

const AUDIT_TABLE = "border-collapse";

const AUDIT_SKELETON_ROW_KEYS = [
  "fx-a1",
  "fx-a2",
  "fx-a3",
  "fx-a4",
  "fx-a5",
  "fx-a6",
  "fx-a7",
  "fx-a8",
  "fx-a9",
  "fx-a10",
  "fx-a11",
  "fx-a12",
] as const;

export function FxAuditTable() {
  return (
    <section className="overflow-x-auto rounded-md border border-border bg-card">
      <Table className={AUDIT_TABLE}>
        <TableHeader>
          <TableRow className="border-b hover:bg-transparent">
            <TableHead>Summary</TableHead>
            <TableHead className="whitespace-nowrap">Updated</TableHead>
            <TableHead className="whitespace-nowrap">Created</TableHead>
            <TableHead className={AUDIT_LOG_ACTIONS_HEAD_CLASS}>
              <span className="sr-only">Details</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {AUDIT_SKELETON_ROW_KEYS.map((rowKey, i) => (
            <TableRow key={rowKey} className="hover:bg-transparent">
              <TableCell className="align-middle max-w-[min(28rem,50vw)]">
                <div className="flex flex-col gap-1.5 py-0.5">
                  <div
                    className={cn(
                      "h-3.5 max-w-full rounded-md bg-muted",
                      i % 4 === 0 ? "w-[92%]" : "w-[88%]",
                    )}
                  />
                  {i % 5 === 0 ? (
                    <div className="h-3.5 w-[55%] max-w-full rounded-md bg-muted" />
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="align-middle">
                <div className="h-4 w-29 rounded-md bg-muted" />
              </TableCell>
              <TableCell className="align-middle">
                <div className="h-4 w-29 rounded-md bg-muted" />
              </TableCell>
              <TableCell className={AUDIT_LOG_ACTIONS_CELL_CLASS}>
                <div className="mx-auto size-8 rounded-md bg-muted" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

const PC_KEYS = ["p1", "p2", "p3", "p4", "p5", "p6"] as const;
const PT_KEYS = [
  "t1",
  "t2",
  "t3",
  "t4",
  "t5",
  "t6",
  "t7",
  "t8",
  "t9",
  "t10",
  "t11",
  "t12",
] as const;

export function FxParticipantsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PC_KEYS.map((key) => (
        <div
          key={key}
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex gap-3">
            <Skeleton className="size-14 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <Skeleton className="h-4 w-[72%] max-w-[200px]" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 shrink-0 rounded-sm" />
              <Skeleton className="h-3 flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 shrink-0 rounded-sm" />
              <Skeleton className="h-3 w-[85%]" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 shrink-0 rounded-sm" />
              <Skeleton className="h-3 w-[60%]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Unassigned + search + sort — same shell as loaded toolbar, using `Skeleton`. */
export function FxParticipantsHeaderToolbar() {
  return (
    <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
      <Skeleton className="h-9 w-[8.75rem] shrink-0" />
      <div className="flex h-auto min-h-0 min-w-0 flex-1 flex-col rounded-md border border-input sm:h-9 sm:flex-row">
        <div className="flex min-h-9 min-w-0 flex-1 items-center gap-2 border-b border-input px-3 sm:border-b-0 sm:py-0">
          <Skeleton className="size-4 shrink-0 rounded-sm" />
          <Skeleton className="h-4 min-w-0 flex-1" />
        </div>
        <div className="flex min-h-9 min-w-0 items-center gap-2 border-t border-input px-2.5 sm:min-w-[22rem] sm:shrink-0 sm:border-t-0 sm:border-l">
          <Skeleton className="size-4 shrink-0 rounded-sm" />
          <Skeleton className="h-4 flex-1 sm:max-w-[12rem]" />
        </div>
      </div>
    </div>
  );
}

/** Mirrors `getParticipantsColumns` order: avatar, game ID, name, dates, contact, birthday, status, lanes, team, actions. */
export function FxParticipantsTable() {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="table-fixed min-w-[78rem]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 py-3">
              <span className="sr-only">Avatar</span>
            </TableHead>
            <TableHead className="py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Game ID
              </span>
            </TableHead>
            <TableHead className="py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Name
              </span>
            </TableHead>
            <TableHead className="whitespace-normal py-3 align-bottom min-w-[7.5rem]">
              <span className="text-xs font-medium text-muted-foreground">
                Date registered
              </span>
            </TableHead>
            <TableHead className="min-w-[9rem] py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Contact
              </span>
            </TableHead>
            <TableHead className="min-w-[9rem] py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Birthday
              </span>
            </TableHead>
            <TableHead className="py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Status
              </span>
            </TableHead>
            <TableHead className="min-w-[6.5rem] py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Preferred lanes
              </span>
            </TableHead>
            <TableHead className="min-w-[8rem] py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Team
              </span>
            </TableHead>
            <TableHead className="w-[120px] py-3">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PT_KEYS.map((rowKey, row) => (
            <TableRow
              key={rowKey}
              className={cn(
                row % 2 === 1 && "bg-muted/20",
                "hover:bg-transparent",
              )}
            >
              <TableCell className="align-middle">
                <Skeleton className="size-8 shrink-0 rounded-full" />
              </TableCell>
              <TableCell className="align-middle">
                <Skeleton className="h-4 w-[5.5rem] max-w-full font-mono" />
              </TableCell>
              <TableCell className="align-middle">
                <Skeleton className="h-4 w-[88%] max-w-[11rem]" />
              </TableCell>
              <TableCell className="align-middle whitespace-normal min-w-[8.5rem]">
                <Skeleton className="h-4 w-[90%]" />
              </TableCell>
              <TableCell className="align-middle">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <Skeleton className="h-4 w-24 shrink-0" />
                  <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
                </div>
              </TableCell>
              <TableCell className="align-middle">
                <Skeleton className="h-4 w-[7.5rem]" />
              </TableCell>
              <TableCell className="align-middle">
                <Skeleton className="h-6 w-[4.5rem] rounded-full" />
              </TableCell>
              <TableCell className="align-middle">
                <div className="flex items-center gap-0.5">
                  <Skeleton className="size-6 shrink-0 rounded-sm" />
                  <Skeleton className="size-6 shrink-0 rounded-sm" />
                  <Skeleton className="size-6 shrink-0 rounded-sm" />
                </div>
              </TableCell>
              <TableCell className="align-middle">
                <div className="flex min-w-0 items-center gap-1">
                  <Skeleton className="size-7 shrink-0 rounded-md" />
                  <Skeleton className="h-4 min-w-0 flex-1" />
                </div>
              </TableCell>
              <TableCell className="w-[120px] align-middle">
                <div className="flex justify-end gap-1">
                  <Skeleton className="size-8 shrink-0 rounded-md" />
                  <Skeleton className="size-8 shrink-0 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Teams route: search row shell (icon + field), same height as loaded `Input` + `pl-9`. */
export function FxTeamsHeaderSearch() {
  return (
    <div className="relative mt-2 flex h-9 w-full items-center gap-2 rounded-md border border-input px-3">
      <Skeleton className="size-4 shrink-0 rounded-sm" />
      <Skeleton className="h-4 min-w-0 flex-1" />
    </div>
  );
}

const TEAM_TABLE_ROW_KEYS = [
  "tr1",
  "tr2",
  "tr3",
  "tr4",
  "tr5",
  "tr6",
  "tr7",
  "tr8",
] as const;

const TEAM_CARD_KEYS = ["tc1", "tc2", "tc3", "tc4", "tc5", "tc6"] as const;

/** Mirrors `getTeamsColumns`: avatar, name, date, captain, members, status, actions. */
export function FxTeamsTable() {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="table-fixed min-w-[56rem]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 px-2 py-3">
              <span className="sr-only">Avatar</span>
            </TableHead>
            <TableHead className="py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Name
              </span>
            </TableHead>
            <TableHead className="whitespace-normal py-3 align-bottom">
              <span className="text-xs font-medium text-muted-foreground">
                Date registered
              </span>
            </TableHead>
            <TableHead className="py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Captain
              </span>
            </TableHead>
            <TableHead className="py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Members
              </span>
            </TableHead>
            <TableHead className="py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Status
              </span>
            </TableHead>
            <TableHead className="w-[104px] py-3 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {TEAM_TABLE_ROW_KEYS.map((rowKey, row) => (
            <TableRow
              key={rowKey}
              className={cn(
                row % 2 === 1 && "bg-muted/20",
                "hover:bg-transparent",
              )}
            >
              <TableCell className="px-2 align-middle">
                <Skeleton className="size-8 shrink-0 rounded-md" />
              </TableCell>
              <TableCell className="align-middle">
                <Skeleton className="h-4 w-[88%] max-w-[10rem]" />
              </TableCell>
              <TableCell className="align-middle whitespace-normal">
                <Skeleton className="h-4 w-[9rem]" />
              </TableCell>
              <TableCell className="align-middle">
                <Skeleton className="h-4 w-[80%] max-w-[9rem]" />
              </TableCell>
              <TableCell className="align-middle">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Skeleton className="h-7 w-28 shrink-0 rounded-md" />
                  <Skeleton className="h-3 w-24 max-w-full" />
                </div>
              </TableCell>
              <TableCell className="align-middle">
                <Skeleton className="h-6 w-20 rounded-full" />
              </TableCell>
              <TableCell className="w-[104px] align-middle">
                <div className="flex justify-end gap-1">
                  <Skeleton className="size-8 shrink-0 rounded-md" />
                  <Skeleton className="size-8 shrink-0 rounded-md" />
                  <Skeleton className="size-8 shrink-0 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function FxTeamsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {TEAM_CARD_KEYS.map((key) => (
        <div
          key={key}
          className="h-fit overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
          <div className="space-y-3 p-4">
            <div className="flex gap-3">
              <Skeleton className="size-12 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                <Skeleton className="h-5 w-[72%] max-w-[200px]" />
                <Skeleton className="h-3 w-28 rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 shrink-0 rounded-sm" />
                <Skeleton className="h-3 flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 shrink-0 rounded-sm" />
                <Skeleton className="h-3 w-[70%]" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FxDemoSkeletonCard() {
  return (
    <div className="grid gap-3 rounded-xl border border-dashed border-border p-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-36 rounded-md bg-muted" />
          <div className="h-4 w-24 rounded-md bg-muted" />
        </div>
      </div>
      <div className="h-20 w-full rounded-md bg-muted" />
    </div>
  );
}
