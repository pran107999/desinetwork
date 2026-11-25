export type ServiceStatus = "ok" | "down";
export type SupabaseHealth = { db: ServiceStatus; auth: ServiceStatus };

type Options = {
  url: string;
  secretKey: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

async function probe(fetchImpl: typeof fetch, url: string, key: string, timeoutMs: number) {
  try {
    const res = await fetchImpl(url, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok ? "ok" : "down";
  } catch {
    return "down";
  }
}

// The REST root only answers 200 when PostgREST can reach Postgres, so it
// doubles as a database check without needing any tables yet.
export async function checkSupabase({
  url,
  secretKey,
  fetchImpl = fetch,
  timeoutMs = 5000,
}: Options): Promise<SupabaseHealth> {
  const base = url.replace(/\/$/, "");
  const [db, auth] = await Promise.all([
    probe(fetchImpl, `${base}/rest/v1/`, secretKey, timeoutMs),
    probe(fetchImpl, `${base}/auth/v1/health`, secretKey, timeoutMs),
  ]);
  return { db, auth } as SupabaseHealth;
}
