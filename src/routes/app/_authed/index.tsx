import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/_authed/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <AdminPlaceholderPage
        title="Dashboard"
        description="Pick a tournament to work in. Several can run in parallel — each has its own participants, teams, and matches."
      />
      <div className="flex flex-wrap gap-2">
        <Link
          to="/app/tournaments"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          Browse tournaments
        </Link>
      </div>
    </div>
  );
}
