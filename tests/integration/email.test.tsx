import { describe, expect, it } from "vitest";
import { TestEmail } from "@/emails/test-email";
import { parseEmailEnv, sendEmail } from "@/lib/notify/email";

// A0.8: real sends through Resend.
// - Always (when RESEND_API_KEY is set): to Resend's test inbox delivered@resend.dev.
// - `EMAIL_TEST_TO=you@example.com pnpm email:test`: also to a real inbox, to check
//   it lands in the inbox (not spam). The address is never stored in the repo.
const hasKey = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
const realInbox = process.env.EMAIL_TEST_TO;
const stamp = () => new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

describe.skipIf(!hasKey)("real email via Resend (A0.8)", () => {
  it("Resend accepts a message from the verified domain", async () => {
    const result = await sendEmail(
      { to: "delivered@resend.dev", subject: "Desinetwork CI email check", template: <TestEmail sentAt={stamp()} /> },
      { env: parseEmailEnv(process.env) },
    );
    expect(result.id).toMatch(/\S+/);
  });

  it.runIf(!!realInbox)("sends the test email to a real inbox", async () => {
    const result = await sendEmail(
      { to: realInbox!, subject: "Desinetwork test email", template: <TestEmail sentAt={stamp()} /> },
      { env: parseEmailEnv(process.env) },
    );
    expect(result.id).toMatch(/\S+/);
  });
});

if (!hasKey) {
  if (process.env.CI) {
    it("Resend secret is configured in CI", () => {
      throw new Error("RESEND_API_KEY secret is missing in CI (GitHub → Settings → Secrets and variables → Actions).");
    });
  } else {
    console.warn("[email] RESEND_API_KEY / EMAIL_FROM not set: skipping real email tests (see README 'Email').");
  }
}
