import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/lib/db/env";
import { checkSupabase } from "@/lib/db/health";

// Runs against whichever Supabase the env points at:
// - `pnpm test:integration`  → local Supabase (.env.local)
// - `pnpm check:cloud`       → cloud staging project (.env.staging.local)
const target = process.env.SUPABASE_TARGET ?? "local";

describe(`Supabase connection: ${target} (A0.2)`, () => {
  it("reaches the database and auth service", async () => {
    const env = parseServerEnv(process.env);
    const health = await checkSupabase({
      url: env.NEXT_PUBLIC_SUPABASE_URL,
      secretKey: env.SUPABASE_SECRET_KEY,
    });
    expect(health).toEqual({ db: "ok", auth: "ok" });
  });

  it("can run a query with the publishable key", async () => {
    const env = parseServerEnv(process.env);
    // No tables yet (A0.3), so query the auth settings endpoint as the anon client would.
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
    });
    expect(res.status).toBe(200);
  });
});
