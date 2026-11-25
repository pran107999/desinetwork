import "server-only";
import type { ReactElement } from "react";
import { render } from "react-email";
import { Resend } from "resend";
import { z } from "zod";
import { maskEmail } from "./mask";

// The only module that talks to Resend (CLAUDE.md §5).

const emailEnvSchema = z.object({
  RESEND_API_KEY: z.string({ error: "RESEND_API_KEY is missing" }).min(1, "RESEND_API_KEY is missing"),
  // e.g. "Desinetwork <no-reply@desinetwork.co>": only our verified domain.
  EMAIL_FROM: z
    .string({ error: "EMAIL_FROM is missing" })
    .regex(/^[^<>]+<[^<>@\s]+@desinetwork\.co>$/, "EMAIL_FROM must be \"Name <address@desinetwork.co>\""),
});
export type EmailEnv = z.infer<typeof emailEnvSchema>;

export function parseEmailEnv(source: Record<string, string | undefined>): EmailEnv {
  const result = emailEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid email environment: ${result.error.issues.map((i) => i.message).join("; ")}`);
  }
  return result.data;
}

// Just the part of the Resend client we use, so tests can pass a fake.
type EmailClient = {
  emails: {
    send(payload: { from: string; to: string; subject: string; html: string; text: string }): Promise<{
      data: { id: string } | null;
      error: { message: string } | null;
    }>;
  };
};

const recipient = z.email();

export async function sendEmail(
  message: { to: string; subject: string; template: ReactElement },
  deps: { client?: EmailClient; env?: EmailEnv } = {},
): Promise<{ id: string }> {
  if (!recipient.safeParse(message.to).success) throw new Error("Invalid email recipient");
  const env = deps.env ?? parseEmailEnv(process.env);
  const client: EmailClient = deps.client ?? new Resend(env.RESEND_API_KEY);

  // Both versions: a plain-text part helps deliverability and accessibility.
  const html = await render(message.template);
  const text = await render(message.template, { plainText: true });

  const { data, error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to: message.to,
    subject: message.subject,
    html,
    text,
  });
  if (error || !data) throw new Error(`Email not sent: ${error?.message ?? "no response from Resend"}`);

  console.info(`[email] sent "${message.subject}" to ${maskEmail(message.to)} (${data.id})`);
  return { id: data.id };
}
