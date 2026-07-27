import { TournamentsPage } from "@/components/landing/tournaments-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tournaments/")({
  component: TournamentsPage,
});
