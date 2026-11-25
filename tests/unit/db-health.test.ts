import { describe, expect, it, vi } from "vitest";
import { checkSupabase } from "@/lib/db/health";

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
