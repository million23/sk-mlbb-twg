import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    viteReact(),
  ],
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
         */
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("xlsx")) return "vendor-xlsx";
          if (id.includes("recharts") || id.includes("/d3-")) return "vendor-recharts";
          if (id.includes("pocketbase")) return "vendor-pocketbase";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("@tanstack/")) return "vendor-tanstack";
          if (id.includes("@base-ui/")) return "vendor-base-ui";
        },
      },
    },
    /** Suppress warning noise once stable chunking is configured. */
    chunkSizeWarningLimit: 1000,
  },
});

export default config;
