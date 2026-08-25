import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Layout wrapper used across admin workspace pages (no enter animation). */
export function AdminStagger({
  className,
  children,
}: {
  /** Kept for call-site compatibility; unused. */
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn(className)}>{children}</div>;
}
