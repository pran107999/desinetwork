import { timingSafeEqual } from "node:crypto";

// GET /api/debug/sentry-test with header `x-debug-token: <DEBUG_TOKEN>`
// throws on purpose so we can see it arrive in Sentry (A0.11).
// Without DEBUG_TOKEN set, or with a wrong token, it behaves like a missing page.
// Reading the request headers keeps this route dynamic (never prerendered).
export async function GET(request: Request) {
  const expected = process.env.DEBUG_TOKEN ?? "";
  const given = request.headers.get("x-debug-token") ?? "";
  const ok =
    expected.length >= 32 &&
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return new Response("Not found", { status: 404 });

  throw new Error(`Sentry test error (A0.11) at ${new Date().toISOString()}`);
}
