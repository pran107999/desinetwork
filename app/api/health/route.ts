import { connection } from "next/server";
import { checkSupabase } from "@/lib/db/health";
import { serverEnv } from "@/lib/db/server-env";
import { deployedCommit } from "@/lib/deploy-info";

// Health check for local dev, CI and staging on Vercel (A0.5). Reports status
// and the deployed commit only; never returns keys, URLs or error details.
export async function GET() {
  // Always run at request time; a health check must never be prerendered.
  await connection();
  let health;
  try {
    const env = serverEnv();
    health = await checkSupabase({
      url: env.NEXT_PUBLIC_SUPABASE_URL,
      secretKey: env.SUPABASE_SECRET_KEY,
    });
  } catch {
    health = { db: "down", auth: "down" } as const;
  }
  const ok = health.db === "ok" && health.auth === "ok";
  return Response.json({ ...health, commit: deployedCommit() }, {
    status: ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
