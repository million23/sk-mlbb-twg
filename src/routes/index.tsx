import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { pb } from "@/lib/pocketbase";

export const Route = createFileRoute("/")({
  component: HomePage,
  beforeLoad: () => {
    if (typeof window !== "undefined" && pb.authStore.isValid) {
      const id = pb.authStore.record?.id;
      if (id) throw redirect({ to: "/app/$id/", params: { id } } as never);
    }
  },
});

function HomePage() {
  const navigate = useNavigate();
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">SK MLBB Tournament Tracker</h1>
        <p className="text-muted-foreground">Barangay 176-E</p>
      </div>
      <div className="flex gap-4">
        <Button onClick={() => navigate({ to: "/app/auth/login" })}>
          Admin login
        </Button>
      </div>
    </main>
  );
}
