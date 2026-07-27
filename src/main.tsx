import { PacerProvider } from "@tanstack/react-pacer";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import ReactDOM from "react-dom/client";
import { queryClient } from "./lib/query-client";
import { getRouter } from "./router";

const router = getRouter();

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <PacerProvider>
        <RouterProvider router={router} />
        <Analytics />
      </PacerProvider>
    </QueryClientProvider>,
  );
}
