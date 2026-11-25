import * as Sentry from "@sentry/nextjs";
import { initAnalytics } from "@/lib/analytics/posthog";
import { sentryOptions } from "@/lib/monitoring/sentry-options";

// Browser error tracking and analytics (A0.11). Each is off unless its key is set.
try {
  Sentry.init(
    sentryOptions({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
    }),
  );
  initAnalytics(process.env.NEXT_PUBLIC_POSTHOG_KEY);
} catch {
  // Monitoring must never break the page.
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
