import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/monitoring/sentry-options";

// Server and edge error tracking (A0.11). Off unless a DSN is set.
export function register() {
  Sentry.init(
    sentryOptions({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, vercelEnv: process.env.VERCEL_ENV }),
  );
}

// Errors thrown while handling a request (pages, route handlers, actions).
export const onRequestError = Sentry.captureRequestError;
