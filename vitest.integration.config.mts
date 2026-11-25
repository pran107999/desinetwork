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
  resolve: {
    tsconfigPaths: true,
    // Next.js enforces "server-only" at build time; tests may import those modules.
    alias: { "server-only": new URL("./tests/stubs/server-only.ts", import.meta.url).pathname },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.{ts,tsx}"],
    env: { ...fileEnv, SUPABASE_TARGET: target },
  },
});
