export type ServiceStatus = "ok" | "down";
export type SupabaseHealth = { db: ServiceStatus; auth: ServiceStatus };
// Why a service is down, safe to show publicly: an HTTP status, "timeout" or
// "network". Never a key, URL or upstream error message.
export type SupabaseProblems = Partial<Record<keyof SupabaseHealth, string>>;

type Options = {
  url: string;
  secretKey: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

type ProbeResult = { status: ServiceStatus; problem?: string };

async function probe(
  fetchImpl: typeof fetch,
  url: string,
  key: string,
  timeoutMs: number,
): Promise<ProbeResult> {
  try {
    const res = await fetchImpl(url, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok ? { status: "ok" } : { status: "down", problem: `http_${res.status}` };
  } catch (e) {
    const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    return { status: "down", problem: timedOut ? "timeout" : "network" };
  }
}

// Same as checkSupabase, plus a short public-safe reason for each failure.
// The REST root only answers 200 when PostgREST can reach Postgres, so it
// doubles as a database check without needing any tables yet.
export async function diagnoseSupabase({
  url,
  secretKey,
  fetchImpl = fetch,
  timeoutMs = 5000,
}: Options): Promise<{ health: SupabaseHealth; problems: SupabaseProblems }> {
  const base = url.replace(/\/$/, "");
  const [db, auth] = await Promise.all([
    probe(fetchImpl, `${base}/rest/v1/`, secretKey, timeoutMs),
    probe(fetchImpl, `${base}/auth/v1/health`, secretKey, timeoutMs),
  ]);
  const problems: SupabaseProblems = {};
  if (db.problem) problems.db = db.problem;
  if (auth.problem) problems.auth = auth.problem;
  return { health: { db: db.status, auth: auth.status }, problems };
}

export async function checkSupabase(options: Options): Promise<SupabaseHealth> {
  return (await diagnoseSupabase(options)).health;
}
