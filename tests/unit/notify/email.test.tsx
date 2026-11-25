// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { TestEmail } from "@/emails/test-email";
import { maskEmail } from "@/lib/notify/mask";
import { parseEmailEnv, sendEmail } from "@/lib/notify/email";

const env = { RESEND_API_KEY: "re_test_key_123", EMAIL_FROM: "Desinetwork <no-reply@desinetwork.co>" };

function fakeClient(result: { data?: { id: string } | null; error?: { message: string } | null }) {
  const send = vi.fn().mockResolvedValue({ data: result.data ?? null, error: result.error ?? null });
  return { client: { emails: { send } }, send };
}

describe("sendEmail (A0.8)", () => {
  it("sends from the configured address with HTML and plain-text versions", async () => {
    const { client, send } = fakeClient({ data: { id: "email_1" } });
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const result = await sendEmail(
      { to: "praneeth@gmail.com", subject: "Hello", template: <TestEmail sentAt="2026-11-25 10:00 UTC" /> },
      { client, env: parseEmailEnv(env) },
    );
    expect(result).toEqual({ id: "email_1" });
    const payload = send.mock.calls[0][0];
    expect(payload).toMatchObject({ from: env.EMAIL_FROM, to: "praneeth@gmail.com", subject: "Hello" });
    expect(payload.html).toContain("Desinetwork");
    expect(payload.html).toContain("2026-11-25 10:00 UTC");
    expect(payload.text).toContain("Desinetwork");
    expect(payload.text).not.toContain("<");
    // Logs never contain the full address (CLAUDE.md §7).
    expect(log.mock.calls.join(" ")).not.toContain("praneeth@gmail.com");
    expect(log.mock.calls.join(" ")).toContain("p***@gmail.com");
    log.mockRestore();
  });

  it("throws a clear error when Resend refuses, without the address or key", async () => {
    const { client } = fakeClient({ error: { message: "The domain is not verified" } });
    const err = await sendEmail(
      { to: "praneeth@gmail.com", subject: "Hi", template: <TestEmail sentAt="now" /> },
      { client, env: parseEmailEnv(env) },
    ).catch((e: Error) => e);
    expect(String(err)).toMatch(/domain is not verified/);
    expect(String(err)).not.toContain("praneeth@gmail.com");
    expect(String(err)).not.toContain(env.RESEND_API_KEY);
  });

  it("names missing variables without showing values", () => {
    expect(() => parseEmailEnv({ EMAIL_FROM: env.EMAIL_FROM })).toThrow(/RESEND_API_KEY/);
    expect(() => parseEmailEnv({ RESEND_API_KEY: env.RESEND_API_KEY })).toThrow(/EMAIL_FROM/);
  });

  it("only sends from a desinetwork.co address", () => {
    expect(() => parseEmailEnv({ ...env, EMAIL_FROM: "Spoof <x@gmail.com>" })).toThrow(/EMAIL_FROM/);
  });

  it("refuses an invalid recipient before calling Resend", async () => {
    const { client, send } = fakeClient({ data: { id: "x" } });
    await expect(
      sendEmail({ to: "not-an-email", subject: "Hi", template: <TestEmail sentAt="now" /> }, { client, env: parseEmailEnv(env) }),
    ).rejects.toThrow(/recipient/);
    expect(send).not.toHaveBeenCalled();
  });
});

describe("maskEmail", () => {
  it("keeps the first letter and the domain only", () => {
    expect(maskEmail("praneeth@gmail.com")).toBe("p***@gmail.com");
    expect(maskEmail("a@b.co")).toBe("a***@b.co");
    expect(maskEmail("nonsense")).toBe("***");
  });
});
