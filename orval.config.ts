import { defineConfig } from "orval";

/**
 * Generate TanStack Query hooks + Zod validators from PocketBase OpenAPI.
 *
 * Source: `src/lib/pocketbase.types.json`
 * Output: `src/hooks/orval/` (hooks, models, zod)
 *
 * Run: `bun run api:generate`
 */
export default defineConfig({
  pocketbase: {
    input: {
      target: "./src/lib/pocketbase.types.json",
    },
    output: {
      mode: "tags-split",
      target: "./src/hooks/orval",
      schemas: "./src/hooks/orval/model",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      prettier: false,
      override: {
        mutator: {
          path: "./src/lib/api/mutator/custom-instance.ts",
          name: "customInstance",
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
          shouldExportQueryKey: true,
        },
      },
    },
  },
  pocketbaseZod: {
    input: {
      target: "./src/lib/pocketbase.types.json",
    },
    output: {
      mode: "tags-split",
      client: "zod",
      target: "./src/hooks/orval/zod",
      fileExtension: ".zod.ts",
      clean: true,
      prettier: false,
      override: {
        zod: {
          version: 4,
          generate: {
            param: true,
            query: true,
            header: true,
            body: true,
            response: true,
          },
        },
      },
    },
  },
});
