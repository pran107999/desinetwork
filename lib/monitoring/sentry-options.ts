import type { ErrorEvent } from "@sentry/nextjs";
import { scrubEvent, scrubText } from "./scrub";

// Vercel's "production" deployment is our staging site until launch (A8).
export function environmentName(vercelEnv: string | undefined): string {
  if (vercelEnv === "production") return "staging";
  if (vercelEnv === "preview") return "preview";
  return "development";
}

// Shared by server, edge and browser. Off unless a DSN is set.
export function sentryOptions({ dsn, vercelEnv }: { dsn: string | undefined; vercelEnv: string | undefined }) {
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: environmentName(vercelEnv),
    sendDefaultPii: false,
    // Errors only for now; performance tracing can be turned on later.
    tracesSampleRate: 0,
    beforeSend(event: ErrorEvent): ErrorEvent | null {
      return scrubEvent(event);
    },
    beforeBreadcrumb<B extends { message?: string }>(breadcrumb: B): B {
      return breadcrumb.message ? { ...breadcrumb, message: scrubText(breadcrumb.message) } : breadcrumb;
    },
  };
}
