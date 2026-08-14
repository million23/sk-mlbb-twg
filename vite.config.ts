import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    viteReact(),
  ],
  test: {
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    clearMocks: true,
  },
  server: {
    port: 1023,
  },
  build: {
    /** Avoid shipping source maps to browsers in production. */
    sourcemap: false,
    rollupOptions: {
      output: {
        /**
         * Keep chunking predictable for the heaviest libraries.
         * Do not group @base-ui here: concatenating its circular ESM graph
         * causes a production TDZ crash.
         */
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("xlsx")) return "vendor-xlsx";
          if (id.includes("recharts") || id.includes("/d3-")) return "vendor-recharts";
          if (id.includes("pocketbase")) return "vendor-pocketbase";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("@tanstack/")) return "vendor-tanstack";
        },
      },
    },
    /** Suppress warning noise once stable chunking is configured. */
    chunkSizeWarningLimit: 1000,
  },
});

export default config;
