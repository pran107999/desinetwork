import { describe, expect, it, vi } from "vitest";
import { environmentName, sentryOptions } from "@/lib/monitoring/sentry-options";

describe("Sentry options (A0.11)", () => {
  it("is off without a DSN, so local and CI send nothing", () => {
    expect(sentryOptions({ dsn: undefined, vercelEnv: undefined }).enabled).toBe(false);
  });

  it("never sends default personal data and scrubs every event", () => {
    const o = sentryOptions({ dsn: "https://k@o1.ingest.sentry.io/1", vercelEnv: "production" });
    expect(o.enabled).toBe(true);
    expect(o.sendDefaultPii).toBe(false);
    const ev = o.beforeSend!({ message: "for a@b.co" } as never) as { message: string };
    expect(ev.message).toBe("for [email]");
  });

  it("tags environments: Vercel production is our staging until launch", () => {
    expect(environmentName("production")).toBe("staging");
    expect(environmentName("preview")).toBe("preview");
    expect(environmentName(undefined)).toBe("development");
  });
});

vi.mock("posthog-js", () => ({ default: { init: vi.fn(), capture: vi.fn(), __loaded: false } }));

describe("PostHog (A0.11)", async () => {
  const posthog = (await import("posthog-js")).default as unknown as { init: ReturnType<typeof vi.fn>; capture: ReturnType<typeof vi.fn> };
  const { initAnalytics, posthogOptions, track } = await import("@/lib/analytics/posthog");

  it("uses our /ingest proxy, records page views, no session recordings, respects Do Not Track", () => {
    expect(posthogOptions()).toMatchObject({
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      capture_pageview: "history_change",
      disable_session_recording: true,
      respect_dnt: true,
      person_profiles: "identified_only",
      autocapture: false,
    });
  });

  it("does nothing without a key", () => {
    expect(initAnalytics(undefined)).toBe(false);
    expect(posthog.init).not.toHaveBeenCalled();
    track("listing_viewed");
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("starts with a key", () => {
    expect(initAnalytics("phc_test")).toBe(true);
    expect(posthog.init).toHaveBeenCalledWith("phc_test", expect.objectContaining({ api_host: "/ingest" }));
    track("listing_viewed", { category: "rentals" });
    expect(posthog.capture).toHaveBeenCalledWith("listing_viewed", { category: "rentals" });
  });
});
