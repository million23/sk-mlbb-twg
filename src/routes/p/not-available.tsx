import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Ban } from "lucide-react";

export const Route = createFileRoute("/p/not-available")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex flex-col gap-10">
            <article
                className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/40 p-6 shadow-[inset_0_1px_0_0] shadow-primary/10 sm:p-10 mt-32"
                aria-labelledby="not-available-heading"
            >
                <div
                    className="pointer-events-none absolute -left-20 top-1/2 size-80 -translate-y-1/2 rounded-full bg-primary/12 blur-3xl"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute -right-8 -top-16 size-56 rounded-full bg-muted/80 blur-2xl dark:bg-muted/40"
                    aria-hidden
                />

                <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
                    <div className="flex shrink-0 justify-center lg:justify-start">
                        <span
                            className="flex size-20 items-center justify-center rounded-2xl border border-primary/35 bg-primary/10 text-primary shadow-[0_0_40px_-12px] shadow-primary/50 sm:size-24"
                            aria-hidden
                        >
                            <Ban className="size-10 sm:size-11" strokeWidth={1.35} />
                        </span>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-5 text-center lg:text-left">
                        <p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.24em]">
                            Public desk · Unavailable
                        </p>
                        <div className="flex flex-col gap-3">
                            <h1
                                id="not-available-heading"
                                className="font-serif text-3xl leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]"
                            >
                                This view is not available
                            </h1>
                            <p className="mx-auto max-w-lg text-muted-foreground text-sm leading-relaxed sm:text-base lg:mx-0">
                                The page you are looking for is not available temporarily, it
                                might be under maintenance, or permanently disabled.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative mt-10 border-border/60 border-t border-dashed pt-6">
                    <p className="text-center font-mono text-[0.6rem] text-muted-foreground uppercase tracking-[0.2em] sm:text-left">
                        Desk notice · Nothing to show yet
                    </p>
                </div>
            </article>

            <Link
                to="/"
                className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "self-center gap-1.5 px-2 text-muted-foreground sm:self-start sm:px-0 hover:text-foreground",
                )}
            >
                <ArrowLeft className="size-4" aria-hidden />
                Back to site root
            </Link>
        </div>
    );
}
