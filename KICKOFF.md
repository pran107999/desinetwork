# Kickoff Guide — Building Desinetwork with Claude Code

This is your starting document. Follow it top to bottom once; after that, use the **task loop** (Step 5) for every task.

---

## What's in this pack

| File | Purpose | Who reads it |
|---|---|---|
| `KICKOFF.md` | This guide: setup steps and prompts | You |
| `CLAUDE.md` | Project rules Claude Code follows every session | Claude Code (auto-loaded) |
| `docs/prd.md` | Requirements v1.0: what to build, MVPs, tasks + acceptance criteria | Both |
| `docs/architecture.md` | Tech stack, flows, data model, setup tasks (A0.x) | Both |
| `docs/design.md` | Canva mockup links, brand colors, type, components | Both |
| `docs/tasks.md` | Progress tracker for all 86 tasks | Both (Claude Code updates it) |
| `.env.example` | List of environment variables (no real values) | Both |

---

## Step 1 — Create accounts (free for now)

Create these with your project email. Free tiers are enough while building.

| Service | Needed for | Needed by task |
|---|---|---|
| GitHub | Code + CI/CD | A0.1 |
| Supabase | Database, login | A0.2 |
| Vercel | Hosting (staging; Pro at launch) | A0.5 |
| Cloudflare | DNS for desinetwork.co, R2 photos, Turnstile | A0.7, A0.13 |
| Resend | Email | A0.8 |
| Twilio | SMS phone verification (pay per SMS at launch) | A0.9 |
| Stripe | Payments (test mode) | A0.10 |
| Sentry, PostHog | Errors, analytics | A0.11 |

You don't need them all on day 1. Create each one when you reach its task.

Install on your computer:
- **Node.js 20+** and **pnpm** (`npm install -g pnpm`)
- **Docker Desktop** (for local Supabase)
- **Supabase CLI**, **Git**, **GitHub CLI** (`gh`)
- **Claude Code**

---

## Step 2 — Set up the project folder

1. Unzip this pack. You'll have a folder `desinetwork/` containing `CLAUDE.md`, `KICKOFF.md`, `.env.example` and `docs/`.
2. Export the Canva screens as PNG into `docs/design/` (see `docs/design.md`).
3. Open a terminal in `desinetwork/` and start Claude Code:
   ```
   cd desinetwork
   claude
   ```

---

## Step 3 — First prompt (orientation)

Paste this as your first message to Claude Code:

```
Read CLAUDE.md, docs/prd.md, docs/architecture.md, docs/design.md and docs/tasks.md.

Then, without writing any code yet:
1. Summarize the product, stack and build rules in 10 bullets.
2. List anything unclear, contradictory or missing in the docs.
3. Confirm the build order starting with task A0.1.
```

Answer any questions it raises, and fix the docs if needed, before moving on.

---

## Step 4 — Second prompt (first task: A0.1)

```
Start task A0.1 from docs/architecture.md §11.

Follow CLAUDE.md §3:
- Show me your plan first and wait for my OK.
- Initialize git, create the Next.js + TypeScript (strict) + Tailwind + shadcn/ui
  project with pnpm, keeping existing CLAUDE.md, KICKOFF.md, .env.example and docs/.
- Add the scripts from CLAUDE.md §10 (lint, typecheck, test, test:e2e).
- Add Vitest and Playwright (375px and 1440px projects) with one passing sample test each.
- Create the GitHub repo "desinetwork" (private), push, and set branch protection on main.
- Update docs/tasks.md and give me a summary of what to check.
```

---

## Step 5 — The task loop (use for every task)

**Order:** all A0.x setup tasks → MVP 0 → MVP 1 → … → MVP 8. Follow `docs/tasks.md` top to bottom.

**Prompt template** (replace `<ID>`):
```
Next task: <ID>.
Read its acceptance criteria in the docs. Follow CLAUDE.md §3 and §4.
Plan first and wait for my OK. Write tests for every acceptance criterion first,
then implement. Run all checks, update docs/tasks.md, open a PR with the template.
```

**When a task needs an account or keys** (Supabase, R2, Resend, Twilio, Stripe…):
- Claude Code tells you which values are needed.
- **You** create the account and paste keys into `.env.local` (never into chat or code) and into Vercel/GitHub secrets.
- Then tell Claude Code "keys are set" and it continues.

**Your review checklist (before merging each PR):**
- [ ] CI is green.
- [ ] Each acceptance criterion maps to a test (see PR description).
- [ ] You tried it yourself on staging at phone size and desktop size.
- [ ] Looks consistent with the mockups / `docs/design.md`.
- [ ] `docs/tasks.md` shows the task as Done.

Then merge, and start the next task in a **new** Claude Code session (or `/clear`) to keep context clean.

---

## Step 6 — Milestone checks

| After | Check |
|---|---|
| A0.x setup | Staging URL works at staging.desinetwork.co; CI blocks failing PRs |
| MVP 1 | You can post an ad with photos and see it on the category page |
| MVP 2 | Sign up, verify email and phone (test number), manage My Ads |
| MVP 3 | Search + filters work and are shareable by URL |
| MVP 5 | A reported ad can be removed from the admin queue |
| MVP 6 | Test payment features an ad; price change in admin works |
| MVP 7 | Events and business directory live: **v1 launch-ready** |
| Pre-launch | Switch to paid: Vercel Pro, Supabase Pro, Twilio live SMS, Stripe live keys, Resend Pro if needed |

---

## Tips
- Keep tasks small. If Claude Code's plan touches many unrelated files, ask it to split the task.
- If something in the docs changes, update `prd.md` / `architecture.md` first, then ask Claude Code to build.
- New decisions go in the Decisions Log sections of the docs.
- If a session goes off track, stop it, `git stash` or reset the branch, and restart the task with a clearer prompt.
