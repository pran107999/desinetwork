import { expect, test } from "@playwright/test";

// Needs local Supabase running (`pnpm db:start`), or BASE_URL pointing at staging.
test("health endpoint reports database and auth ok without leaking config", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toEqual({ db: "ok", auth: "ok", commit: expect.stringMatching(/^([0-9a-f]{7}|local)$/) });
  expect(res.headers()["cache-control"]).toContain("no-store");
  const text = JSON.stringify(body);
  expect(text).not.toMatch(/sb_(secret|publishable)_|127\.0\.0\.1|supabase\.co/);
});
