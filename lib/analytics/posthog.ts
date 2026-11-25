import posthog from "posthog-js";

// Product analytics (PostHog). The only code that talks to PostHog
// (CLAUDE.md §5). Off unless NEXT_PUBLIC_POSTHOG_KEY is set.

export function posthogOptions() {
  return {
    // Sent through our own domain (next.config.ts rewrites) so ad blockers
    // don't silently drop most events.
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    capture_pageview: "history_change" as const,
    capture_pageleave: true,
    // Privacy: no recordings, no automatic click capture, honour Do Not Track,
    // anonymous until sign-in.
    disable_session_recording: true,
    autocapture: false,
    respect_dnt: true,
    person_profiles: "identified_only" as const,
  };
}

let started = false;

export function initAnalytics(key: string | undefined): boolean {
  if (!key) return false;
  posthog.init(key, posthogOptions());
  started = true;
  return true;
}

// Custom product events (funnels later). Never pass personal data here.
export function track(event: string, properties?: Record<string, string | number | boolean>): void {
  if (!started) return;
  posthog.capture(event, properties);
}
