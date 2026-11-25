import { connection } from "next/server";
import { diagnoseSupabase } from "@/lib/db/health";
import { serverEnv } from "@/lib/db/server-env";
import { deployedCommit } from "@/lib/deploy-info";

// Health check for local dev, CI and staging on Vercel (A0.5). Reports status,
// the deployed commit and, when down, a short reason (missing variable names,
// HTTP status, "timeout" or "network"). Never keys, URLs or error details.
export async function GET() {
  // Always run at request time; a health check must never be prerendered.
  await connection();
  const commit = deployedCommit();
  const headers = { "Cache-Control": "no-store" };

  let env;
  try {
    env = serverEnv();
  } catch (e) {
    // The env error lists variable names only (see lib/db/env.ts).
    const reason = e instanceof Error ? e.message.replace(/^Invalid Supabase environment: /, "") : "config";
    console.error(`[health] config problem: ${reason}`);
    return Response.json({ db: "down", auth: "down", commit, reason: `config: ${reason}` }, { status: 503, headers });
  }

  const { health, problems } = await diagnoseSupabase({
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    secretKey: env.SUPABASE_SECRET_KEY,
  });
  const ok = health.db === "ok" && health.auth === "ok";
  if (!ok) console.error(`[health] supabase problem: ${JSON.stringify(problems)}`);
  return Response.json(ok ? { ...health, commit } : { ...health, commit, problems }, {
    status: ok ? 200 : 503,
    headers,
  });
}
