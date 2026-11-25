# lib/analytics
Product analytics (PostHog). `initAnalytics()` runs in `instrumentation-client.ts`; feature code calls `track()`.
Page views are automatic. Never send personal data (emails, phones, names) as properties.
Our own activity log for AI features is `lib/events` (A0.12), separate from this.
