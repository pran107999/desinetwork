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

## Photo storage (Cloudflare R2)
Two private buckets: `desinetwork-photos-dev` (your Mac + CI) and `desinetwork-photos-staging` (Vercel). Each has its own API token limited to that bucket. Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` in `.env.local` (dev), `.env.staging.local` and Vercel (staging); CI uses GitHub Actions secrets (dev).

Uploads: the browser calls `POST /api/uploads/sign` with `{ contentType, size }` (signed-in users only) and PUTs the file straight to R2 with the returned link (5 minutes, type and size locked). Originals land in `incoming/<user>/`; resizing and GPS removal arrive in T1.5.

```bash
pnpm test:integration                     # includes a real upload to the dev bucket (skips without R2 keys)
KEEP_TEST_UPLOAD=1 pnpm test:integration  # keep the test file so you can see it in the Cloudflare dashboard
```

## Email (Resend)
Sends from `Desinetwork <no-reply@desinetwork.co>`; the domain is verified in Resend (DNS at GoDaddy: `resend._domainkey` TXT and `send` CNAME). `otp.desinetwork.co` is an older verified subdomain, left as is. The API key has **sending access** only. Set `RESEND_API_KEY` and `EMAIL_FROM` in `.env.local`, Vercel and the GitHub secret `RESEND_API_KEY`.

Code: `lib/notify/email.ts` (`sendEmail`), templates in `/emails`. Logs never show full addresses.

```bash
pnpm email:test                                 # real send to Resend's test inbox (delivered@resend.dev)
EMAIL_TEST_TO=you@example.com pnpm email:test   # also send to your own inbox
```
