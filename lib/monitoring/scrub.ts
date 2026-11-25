// Removes personal data and secrets before anything is sent to Sentry
// (CLAUDE.md §7: never log emails, phone numbers, tokens or keys).

const patterns: Array<[RegExp, string]> = [
  // Keys and tokens first, so their parts aren't mistaken for other data.
  [/\bBearer\s+[A-Za-z0-9._~+/-]+=*/g, "Bearer [secret]"],
  [/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[secret]"],
  [/\b(?:sb_secret|sb_publishable|sk_live|sk_test|rk_live|rk_test|whsec|re|phc)_[A-Za-z0-9_-]+/g, "[secret]"],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]"],
  // US phone numbers: +1 732 555 0100, (732) 555-0100, 732-555-0100, +17325550100, 7325550100
  [/(?<!\d)(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/g, "[phone]"],
];

export function scrubText(text: string): string {
  return patterns.reduce((out, [re, replacement]) => out.replace(re, replacement), text);
}

function scrubDeep(value: unknown, depth = 0): unknown {
  if (depth > 12) return value;
  if (typeof value === "string") return scrubText(value);
  if (Array.isArray(value)) return value.map((v) => scrubDeep(v, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrubDeep(v, depth + 1)]));
  }
  return value;
}

// The parts of a Sentry event this function reads. Accepts any event shape
// (Sentry's own type has no index signature), returning the same type.
type ScrubbableEvent = {
  request?: { headers?: Record<string, unknown>; cookies?: unknown; [k: string]: unknown };
  user?: { id?: unknown; [k: string]: unknown };
  [k: string]: unknown;
};

const dropHeaders = new Set(["cookie", "authorization", "x-debug-token", "set-cookie"]);

export function scrubEvent<T extends object>(event: T): T {
  const copy = { ...event } as ScrubbableEvent;
  if (copy.request) {
    const { cookies: _cookies, headers, ...rest } = copy.request;
    void _cookies;
    copy.request = {
      ...rest,
      ...(headers
        ? { headers: Object.fromEntries(Object.entries(headers).filter(([k]) => !dropHeaders.has(k.toLowerCase()))) }
        : {}),
    };
  }
  // Keep only an opaque user id; never email, IP or name.
  if (copy.user) copy.user = copy.user.id !== undefined ? { id: copy.user.id } : undefined;
  return scrubDeep(copy) as T;
}
