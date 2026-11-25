import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "./server-env";

// Admin client with the secret key: BYPASSES row-level security.
// Server-only; use only for trusted jobs (webhooks, cron, health checks),
// never with user-controlled filters without a permission check first.
export function createAdminClient() {
  const env = serverEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
