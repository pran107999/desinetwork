# Desinetwork

Classifieds for the South Asian / Desi community in US cities ([desinetwork.co](https://desinetwork.co)).

Start with `KICKOFF.md`, `CLAUDE.md` and `docs/`.

## Local development
Requires Node 20.9+ and pnpm.

```bash
pnpm install
pnpm exec playwright install chromium   # once, for e2e tests
pnpm dev                                 # http://localhost:3000
```

Checks (run before every PR): `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`

## Local Supabase
Requires Docker Desktop (running) and the Supabase CLI.

```bash
pnpm db:start          # start local Postgres + Auth in Docker (Studio: http://127.0.0.1:54323)
supabase status -o env # copy API_URL / PUBLISHABLE_KEY / SECRET_KEY into .env.local (see .env.example)
pnpm test:integration  # checks the app can reach local Supabase
pnpm db:stop
```

Cloud staging: put the staging project's values in `.env.staging.local` (gitignored), then run `pnpm check:cloud`.
Health check: `GET /api/health` returns `{ "db": "ok", "auth": "ok" }`.

## CI
Every pull request and every push to `main` runs `.github/workflows/ci.yml` (job **checks**): lint, type check, unit tests, local Supabase + integration tests, and Playwright e2e at 375px and 1440px. `main` only accepts PRs whose **checks** job passed. Node version: `.nvmrc`.

## Staging (Vercel)
`main` deploys automatically to the Vercel project's production URL, which is our **staging** site until launch. Every PR gets its own preview URL. Functions run in `pdx1` (next to Supabase). Environment variables are set in Vercel → Project → Settings → Environment Variables (Production and Preview).

```bash
STAGING_URL=https://<project>.vercel.app pnpm check:staging   # e2e tests against staging, 375px + 1440px
```
`GET /api/health` shows `{ db, auth, commit }`; `commit` is the deployed git commit.
