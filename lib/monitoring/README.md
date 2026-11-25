# lib/monitoring
Error tracking (Sentry). The only code that configures Sentry (CLAUDE.md §5).

- `sentry-options.ts`: shared server/edge/browser settings; off without a DSN; no default personal data.
- `scrub.ts`: removes emails, US phone numbers, keys and tokens, cookies and auth headers from every event.

Wired up in `instrumentation.ts` and `instrumentation-client.ts`.
