import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function ChartCard({
  title,
  description,
  children,
  className,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No data available yet.",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl border border-border/80 bg-background/70 p-4 shadow-xs backdrop-blur-sm sm:p-5",
        className,
      )}
    >
      <div className="mb-3 flex flex-col gap-1">
        <h2 className="font-heading font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {isLoading ? (
        <Skeleton className="h-[220px] w-full rounded-xl" />
      ) : isEmpty ? (
        <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 text-center text-muted-foreground text-sm">
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </section>
  );
}
