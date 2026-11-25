import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "./env";
import type { Database } from "./types";

// Supabase client for Client Components. Uses the publishable key, so
// row-level security decides what it can read or write.
export function createClient() {
  const env = publicEnv();
  return createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
