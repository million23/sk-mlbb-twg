import { createFileRoute, redirect } from "@tanstack/react-router";

/** Short alias → canonical admin auth login. */
export const Route = createFileRoute("/app/login")({
  beforeLoad: () => {
    throw redirect({ to: "/app/auth/login" });
  },
  component: () => null,
});
