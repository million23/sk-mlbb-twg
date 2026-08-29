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

export interface AdminTableSkeletonColumn {
  key: string;
  label: string;
  headClassName?: string;
  cellClassName?: string;
  /** Bone classes. Arrays cycle by row so names do not all look the same length. */
  boneClassName: string | readonly string[];
  stacked?: boolean;
}

const ROW_KEYS = ["a", "b", "c", "d", "e", "f", "g", "h", "i"] as const;

export function AdminTableSkeleton({
  columns,
  rows = 8,
}: {
  columns: readonly AdminTableSkeletonColumn[];
  rows?: number;
}) {
  const rowKeys = ROW_KEYS.slice(0, rows);

  return (
    <div
      className="overflow-x-auto rounded-lg border border-border"
      aria-busy="true"
    >
      <span className="sr-only">Loading</span>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.headClassName}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rowKeys.map((rowKey, row) => (
            <TableRow key={rowKey} aria-hidden>
              {columns.map((col) => {
                const spec = col.boneClassName;
                const bone =
                  typeof spec === "string" ? spec : spec[row % spec.length];
                return (
                  <TableCell key={col.key} className={col.cellClassName}>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <Skeleton className={cn("rounded-md", bone)} />
                      {col.stacked ? (
                        <Skeleton className="h-3 w-24 rounded-md md:hidden" />
                      ) : null}
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
