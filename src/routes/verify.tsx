import { VerifyPage } from "@/components/registration/verify-page";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const verifySearchSchema = z.object({
  code: z.string().optional(),
});

export const Route = createFileRoute("/verify")({
  validateSearch: verifySearchSchema,
  component: VerifyRoute,
});

function VerifyRoute() {
  const { code } = Route.useSearch();
  return <VerifyPage initialCode={code} />;
}
