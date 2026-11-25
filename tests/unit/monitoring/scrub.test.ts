import { describe, expect, it } from "vitest";
import { scrubEvent, scrubText } from "@/lib/monitoring/scrub";

describe("scrubText (A0.11: no personal data or secrets in Sentry)", () => {
  it("removes email addresses", () => {
    expect(scrubText("user praneeth@gmail.com failed")).toBe("user [email] failed");
  });

  it("removes US phone numbers in common formats", () => {
    for (const p of ["+1 732 555 0100", "(732) 555-0100", "732-555-0100", "+17325550100"]) {
      expect(scrubText(`call ${p} now`)).toBe("call [phone] now");
    }
  });

  it("removes keys and tokens", () => {
    const samples = [
      "sb_secret_" + "FAKE0000000000000000",
      "sb_publishable_" + "FAKE0000000000000000",
      "re_" + "FAKE0000000000",
      "sk_test_" + "FAKE0000",
      "whsec_" + "FAKE0000",
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcDEF_123",
    ];
    for (const s of samples) expect(scrubText(`key=${s}`)).toBe("key=[secret]");
    expect(scrubText("Authorization: Bearer abc.def-123")).toBe("Authorization: Bearer [secret]");
  });

  it("leaves ordinary text, ids and prices alone", () => {
    const t = "Listing 42 costs $900, created 2026-11-25 (id 6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b)";
    expect(scrubText(t)).toBe(t);
  });
});

describe("scrubEvent", () => {
  it("scrubs messages, exception values, breadcrumbs and request data; drops cookies and auth headers", () => {
    const event = {
      message: "signup failed for a@b.co",
      exception: { values: [{ type: "Error", value: "bad key " + "sb_secret_" + "FAKE0000" }] },
      breadcrumbs: [{ message: "fetch https://x.test/?email=a@b.co" }],
      request: {
        url: "https://desinetwork.vercel.app/x?phone=7325550100",
        headers: { cookie: "sb-access-token=xyz", authorization: "Bearer xyz", "user-agent": "test" },
        cookies: { a: "b" },
      },
      user: { email: "a@b.co", ip_address: "1.2.3.4", id: "u1" },
    };
    const out = scrubEvent(event);
    expect(JSON.stringify(out)).not.toMatch(/a@b\.co|sb_secret_|7325550100|xyz|1\.2\.3\.4/);
    expect(out.request?.headers).toEqual({ "user-agent": "test" });
    expect(out.request?.cookies).toBeUndefined();
    expect(out.user).toEqual({ id: "u1" });
    expect(out.exception?.values?.[0]?.type).toBe("Error");
  });
});
