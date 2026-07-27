import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Staggered fade/slide-in used across admin workspace pages. */
export function AdminStagger({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "tournament-overview-stagger animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
        className,
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {children}
    </div>
  );
}
