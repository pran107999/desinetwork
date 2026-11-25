import { describe, expect, it, vi } from "vitest";
import { checkSupabase, diagnoseSupabase } from "@/lib/db/health";

const ok = () => Promise.resolve(new Response("{}", { status: 200 }));

describe("checkSupabase (A0.2)", () => {
  it("reports ok when REST and auth both answer 200", async () => {
    const fetchImpl = vi.fn(ok) as unknown as typeof fetch;
    await expect(
      checkSupabase({ url: "http://db.test/", secretKey: "k", fetchImpl }),
    ).resolves.toEqual({ db: "ok", auth: "ok" });
    const urls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(urls).toEqual(["http://db.test/rest/v1/", "http://db.test/auth/v1/health"]);
  });

  it("reports down for a failing service without throwing", async () => {
    const fetchImpl = vi.fn((url: string) =>
      url.includes("/rest/") ? Promise.reject(new Error("ECONNREFUSED")) : ok(),
    ) as unknown as typeof fetch;
    await expect(checkSupabase({ url: "http://db.test", secretKey: "k", fetchImpl })).resolves.toEqual({
      db: "down",
      auth: "ok",
    });
  });

  it("treats non-2xx responses as down", async () => {
    const fetchImpl = vi.fn(() => Promise.resolve(new Response("", { status: 503 }))) as unknown as typeof fetch;
    await expect(checkSupabase({ url: "http://db.test", secretKey: "k", fetchImpl })).resolves.toEqual({
      db: "down",
      auth: "down",
    });
  });
});

describe("diagnoseSupabase (A0.5 follow-up)", () => {
  it("reports the HTTP status of a rejected call", async () => {
    const fetchImpl = vi.fn((url: string) =>
      Promise.resolve(new Response("", { status: url.includes("/rest/") ? 401 : 200 })),
    ) as unknown as typeof fetch;
    await expect(diagnoseSupabase({ url: "http://db.test", secretKey: "k", fetchImpl })).resolves.toEqual({
      health: { db: "down", auth: "ok" },
      problems: { db: "http_401" },
    });
  });

  it("reports network failures and timeouts without error details", async () => {
    const timeout = Object.assign(new Error("secret-ish detail"), { name: "TimeoutError" });
    const fetchImpl = vi.fn((url: string) =>
      Promise.reject(url.includes("/rest/") ? new Error("getaddrinfo ENOTFOUND x") : timeout),
    ) as unknown as typeof fetch;
    const result = await diagnoseSupabase({ url: "http://db.test", secretKey: "k", fetchImpl });
    expect(result.problems).toEqual({ db: "network", auth: "timeout" });
    expect(JSON.stringify(result)).not.toMatch(/ENOTFOUND|secret-ish/);
  });
});
