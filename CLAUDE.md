# CLAUDE.md — Desinetwork

Rules for Claude Code working in this repository. Read this file at the start of every session.

## 1. Project
- **Desinetwork** (desinetwork.co): a classifieds marketplace for the South Asian / Desi community in US cities.
- Launch scope: **US only, 11 cities**, **responsive web only** (mobile-first).
- Requirements: `docs/prd.md` (v1.0). Architecture: `docs/architecture.md` (v1.0). Design: `docs/design.md`. Progress: `docs/tasks.md`.
- If these docs conflict, `prd.md` wins for *what* to build and `architecture.md` wins for *how*. Ask the product owner if unsure; do not guess on scope.

## 2. Stack (do not change without approval)
- Next.js (App Router) + **TypeScript (strict)** + Tailwind CSS + shadcn/ui
- Supabase: PostgreSQL, Auth (email code, Google, phone), pg_cron
- Hosting: Vercel (functions in `pdx1`, next to Supabase us-west-2) · Photos: Cloudflare R2 · Email: Resend + React Email · SMS: Twilio Verify (via Supabase phone auth) · Payments: Stripe · Errors: Sentry · Analytics: PostHog · Bot protection: Cloudflare Turnstile
- Tests: Vitest (unit/integration), Playwright (e2e at 375px and 1440px)
- Package manager: **pnpm**

Do not add a new dependency or external service without saying why in the PR description.

## 3. How to work on a task
1. Work on **one task ID at a time** (from `docs/tasks.md`), on a branch named `feat/<TASK-ID>-short-name` (e.g., `feat/T1.3-post-ad-details`).
2. Read the task row and its acceptance criteria (AC) in `docs/prd.md` or `docs/architecture.md`.
3. Before coding, write a short plan: files to change, DB changes, tests to add. Keep the change small.
4. **Write tests first** that prove each AC, then implement until they pass.
5. With local Supabase running (`pnpm db:start`), run `pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration && pnpm test:db && pnpm test:e2e` before declaring done. After a migration, run `supabase db reset` and `pnpm db:types` first.
6. Update `docs/tasks.md`: set the task to `Done` (or `Blocked` with a reason).
7. Open a PR using the template in §9.

Do not start the next task in the same branch. Do not implement features from later MVPs "while you're there".

## 4. Definition of done
- Every acceptance criterion has at least one automated test.
- Lint, type check, unit and e2e tests pass locally and in CI.
- UI works at **375px** and **1440px**; screenshots attached to the PR.
- Accessible: labels on inputs, keyboard navigation, alt text, color contrast (WCAG 2.1 AA).
- No secrets, keys or personal data in code, tests, logs or commits.
- `docs/tasks.md` updated.

## 5. Architecture rules
- **External services only through `lib/` wrappers**: `lib/search`, `lib/storage`, `lib/notify` (email/SMS), `lib/payments`, `lib/ai`, `lib/events`. Feature code never imports a provider SDK directly.
- **Search** goes through `SearchService` in `lib/search`. Keyword (Postgres full-text) now; AI later behind the same interface.
- **Moderation** is a pipeline of checks in `lib/moderation`; each check returns `{ decision: 'allow' | 'review' | 'block', reason }`.
- **Event logging**: call `logEvent()` for view, search, post, contact, save (feeds AI later).
- **Category fields** are data (`category_fields` table), not hard-coded forms.
- **Cities**: city-only model (name, state label, slug). No country/region UI. Keep it possible to add `country` later.
- Server-render public pages (home, city, category, listing) for SEO. Clean URLs: `/<city-slug>/<category-slug>/<subcategory-slug>/<listing-slug>`.

## 6. Database rules
- All schema changes via **Supabase migration files** in `supabase/migrations/`. Never change the DB by hand.
- **Row-level security (RLS) on every table**, with a test for each policy (e.g., user A cannot edit user B's listing).
- Seed data lives in `supabase/seed.sql` (11 cities, 7 categories, subcategories, fields).
- Use `snake_case` for tables/columns; timestamps `created_at`, `updated_at` (UTC).
- Money in **integer cents**.

## 7. Security rules
- Secrets only in environment variables; keep `.env.example` updated with every new variable (no real values).
- Validate all input on the server (use `zod`); never trust the client.
- Permission checks on every API route and server action.
- Rate-limit login, OTP, posting and messaging.
- Uploaded images: check type and size, re-encode with `sharp`, strip location (EXIF/GPS) data.
- Stripe: verify webhook signatures; never store card data.
- Never log passwords, OTP codes, tokens or full phone numbers.

## 8. Code style
- TypeScript strict; no `any` unless justified in a comment.
- Server Components by default; Client Components only when needed.
- Small, focused files; name things clearly. Comments explain *why*, not *what*.
- UI text in one place per feature (ready for translation later).
- Follow `docs/design.md` for colors, type and components.

## 9. PR template
```
## Task
<TASK-ID>: <title>

## What changed
- ...

## Acceptance criteria → tests
- AC1: <criterion> → <test file / test name>
- AC2: ...

## DB changes
<migrations added, or "none">

## Screenshots
375px: ...   1440px: ...

## Notes / follow-ups
...
```

## 10. Commands
```
pnpm dev               # run app locally
pnpm lint              # ESLint
pnpm typecheck         # next typegen + tsc --noEmit
pnpm test              # Vitest unit tests
pnpm test:integration  # Vitest against local Supabase (.env.local)
pnpm test:db           # pgTAP database tests in supabase/tests (e.g. RLS on every table)
pnpm test:e2e          # Playwright (375px + 1440px); needs local Supabase
pnpm check:cloud       # connection check against cloud staging (.env.staging.local)
pnpm db:start          # local Supabase (Docker)
pnpm db:stop
pnpm db:reset          # re-run migrations + seed
pnpm db:types          # regenerate lib/db/types.ts after a migration
```
Cloud staging: `supabase db push --remote` applies new migrations (dry-run first). The seed only inserts; never re-run it on staging.

## 11. Do not
- Do not build matrimonial features (permanently out of scope).
- Do not add non-US countries or a country selector.
- Do not build native mobile apps.
- Do not call AI providers outside `lib/ai`.
- Do not push directly to `main`.
