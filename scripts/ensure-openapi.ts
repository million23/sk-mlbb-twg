import { statSync } from "node:fs";

const path = "src/lib/pocketbase.types.json";

try {
  const { size } = statSync(path);
  if (size < 100) {
    console.error(
      `[api:generate] ${path} is empty on disk (${size} bytes).\n` +
        `Save the OpenAPI file in the editor (Ctrl+S), then run: bun run api:generate`,
    );
    process.exit(1);
  }
  console.log(`[api:generate] OpenAPI ok (${size} bytes)`);
} catch {
  console.error(`[api:generate] Missing ${path}`);
  process.exit(1);
}
