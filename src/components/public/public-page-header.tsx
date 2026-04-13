import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type PublicPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
};

export function PublicPageHeader({
  eyebrow = "Spectator desk",
  title,
  description,
  icon: Icon,
  className,
}: PublicPageHeaderProps) {
  return (
    <header
      className={cn(
        "border-border/60 border-b pb-8 text-center",
        className,
      )}
    >
      <p className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.22em]">
        {eyebrow}
      </p>
      <div className="mx-auto mt-4 flex max-w-2xl flex-col items-center gap-4 md:mt-5 md:max-w-3xl md:gap-5">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-primary/35 bg-linear-to-br from-primary/20 to-primary/5 text-primary shadow-[0_0_32px_-8px] shadow-primary/40"
          aria-hidden
        >
          <Icon className="size-7" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 space-y-2 px-1">
          <h1 className="font-serif text-3xl leading-[1.1] tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
            {description}
          </p>
        </div>
      </div>
    </header>
  );
}
