// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const call = async (token?: string) => {
  const { GET } = await import("@/app/api/debug/sentry-test/route");
  return GET(new Request("http://localhost/api/debug/sentry-test", { headers: token ? { "x-debug-token": token } : {} }));
};

describe("GET /api/debug/sentry-test (A0.11)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is a 404 when DEBUG_TOKEN is not configured", async () => {
    vi.stubEnv("DEBUG_TOKEN", "");
    expect((await call("anything")).status).toBe(404);
  });

  it("is a 404 without the right token", async () => {
    vi.stubEnv("DEBUG_TOKEN", "a".repeat(32));
    expect((await call()).status).toBe(404);
    expect((await call("b".repeat(32))).status).toBe(404);
    expect((await call("a".repeat(31))).status).toBe(404);
  });

  it("throws a test error for Sentry with the right token", async () => {
    vi.stubEnv("DEBUG_TOKEN", "a".repeat(32));
    await expect(call("a".repeat(32))).rejects.toThrow(/Sentry test error/);
  });
});
