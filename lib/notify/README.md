# lib/notify
Email (Resend + React Email) now; SMS (Twilio via Supabase) in A0.9.

- `email.ts` (server-only): `sendEmail({ to, subject, template })`, sends HTML + plain text from `EMAIL_FROM`.
- `mask.ts`: `maskEmail()` for logs; never log full addresses.
- Templates live in `/emails`.
