import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseServerEnv } from "@/lib/db/env";
import { deleteEmailsTo, sixDigitCode, waitForEmail } from "../support/mailpit";

// A0.9e: sign-in with a 6-digit email code (Supabase Auth). Local only:
// codes are read from the local test inbox (Mailpit); nothing real is sent.
const isLocal = (process.env.SUPABASE_TARGET ?? "local") === "local";

describe.runIf(isLocal)("email one-time codes (A0.9e)", () => {
  const env = parseServerEnv(process.env);
  const opts = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, opts);
  const visitor = () => createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, opts);
  const emails: string[] = [];
  const newEmail = () => {
    const e = `a09e-${randomUUID()}@example.test`;
    emails.push(e);
    return e;
  };

  // Right after `supabase start`, Auth can't fetch custom templates yet and
  // quietly sends its default email; it reloads them within about a minute.
  // Wait until the branded template is live so the checks below are meaningful.
  beforeAll(async () => {
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      const probe = newEmail();
      await visitor().auth.signInWithOtp({ email: probe });
      if (/Desinetwork/.test((await waitForEmail(probe)).Subject)) return;
      await new Promise((r) => setTimeout(r, 5_000));
    }
    throw new Error("Supabase Auth never switched to the Desinetwork email template (see supabase/config.jsonc)");
  }, 100_000);

  afterAll(async () => {
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const u of data.users.filter((x) => x.email && emails.includes(x.email))) {
      await admin.auth.admin.deleteUser(u.id);
    }
    for (const e of emails) await deleteEmailsTo(e);
  });

  it("emails a 6-digit code that signs the user in (AC1)", async () => {
    const email = newEmail();
    const client = visitor();
    const sent = await client.auth.signInWithOtp({ email });
    expect(sent.error).toBeNull();

    const message = await waitForEmail(email);
    const code = sixDigitCode(message.Text);
    expect(code).toMatch(/^\d{6}$/);

    const { data, error } = await client.auth.verifyOtp({ email, token: code!, type: "email" });
    expect(error).toBeNull();
    expect(data.session?.access_token).toBeTruthy();
    expect(data.user?.email).toBe(email);

    // The new user got a profile (A0.3 trigger) and can read it (A0.4 rules).
    const profile = await client.from("profiles").select("id, role").eq("id", data.user!.id).single();
    expect(profile.data).toEqual({ id: data.user!.id, role: "user" });
  });

  it("sends a branded code email with no sign-in link", async () => {
    const email = newEmail();
    await visitor().auth.signInWithOtp({ email });
    const message = await waitForEmail(email);
    expect(message.Subject).toMatch(/Desinetwork/);
    expect(message.HTML).toContain(sixDigitCode(message.Text));
    expect(message.HTML).toMatch(/Desi/);
    expect(message.HTML).toMatch(/10 minutes/);
    expect(message.HTML).not.toMatch(/\/auth\/v1\/verify|token_hash|href="http/);
  });

  it("rejects a wrong code (AC2)", async () => {
    const email = newEmail();
    const client = visitor();
    await client.auth.signInWithOtp({ email });
    const code = sixDigitCode((await waitForEmail(email)).Text)!;
    const wrong = code === "000000" ? "111111" : "000000";
    const { data, error } = await client.auth.verifyOtp({ email, token: wrong, type: "email" });
    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });

  it("refuses a second code request within 60 seconds (AC2)", { timeout: 15_000 }, async () => {
    const email = newEmail();
    const client = visitor();
    expect((await client.auth.signInWithOtp({ email })).error).toBeNull();
    await waitForEmail(email);
    await new Promise((r) => setTimeout(r, 2000)); // longer than Supabase's default 1 s
    const again = await client.auth.signInWithOtp({ email });
    expect(again.error).not.toBeNull();
    expect(again.error?.status).toBe(429);
  });
});
