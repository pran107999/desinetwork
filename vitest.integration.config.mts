import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { defineConfig } from "vitest/config";

// Integration tests talk to a real Supabase. SUPABASE_TARGET picks the env file:
// "local" (default) → .env.local, "cloud" → .env.staging.local (both gitignored).
const target = process.env.SUPABASE_TARGET === "cloud" ? "cloud" : "local";
const file = target === "cloud" ? ".env.staging.local" : ".env.local";
if (!existsSync(file)) {
  throw new Error(`${file} not found. See README "Local Supabase".`);
}
const fileEnv = parseEnv(readFileSync(file, "utf8")) as Record<string, string>;

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    env: { ...fileEnv, SUPABASE_TARGET: target },
  },
});
