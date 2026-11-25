# Task Tracker — Desinetwork

Status: `Todo` · `In progress` · `Done` · `Blocked (reason)`
Rules: one task per branch; mark `Done` only when all acceptance criteria pass in CI (see CLAUDE.md §4).
Acceptance criteria live in `prd.md` (T-tasks) and `architecture.md` §11 (A0-tasks).

Note: PRD T0.1 is covered by A0.1, A0.5 and A0.6; T0.2/T0.3 by A0.3; T0.6 by A0.12. Mark them Done together.

## Setup (architecture.md §11): do first
| ID | Task | Status | PR / notes |
|---|---|---|---|
| A0.1 | Create GitHub repo + Next.js (TypeScript, Tailwind, shadcn/ui) project; add `CLAUDE.md`, `/docs`, `.env.exa… | Done | `feat/A0.1-project-setup`; Playwright 375/1440 projects already in place (part of A0.14) |
| A0.2 | Create Supabase project + set up local Supabase CLI | Done | `feat/A0.2-supabase`; cloud project `desinetwork` (us-west-2) linked; `pnpm check:cloud` passes |
| A0.3 | First migration: cities, categories, category_fields, profiles + seed 11 cities & 7 categories | Done | `feat/A0.3-master-data`; migration + seed applied to cloud staging |
| A0.4 | Row-level security policies baseline | Done | `feat/A0.4-rls-baseline`; profile policies + `is_staff()`; pgTAP safety net in CI; migration applied to staging |
| A0.5 | Deploy to Vercel (staging) from `main` | Done | Vercel project `desinetwork`, staging https://desinetwork.vercel.app (pdx1). Merge of PR #9 (`e1c62ab`) appeared in staging `/api/health`; `pnpm check:staging` 4/4 |
| A0.6 | GitHub Actions CI: lint, type check, unit + e2e tests | Done | `feat/A0.6-ci`; `checks` job required on `main`; failing-test PR #6 was blocked. Done before A0.4/A0.5 by agreement |
| A0.7 | Cloudflare R2 bucket + signed upload API | Done | `feat/A0.7-r2-uploads`; buckets `desinetwork-photos-dev`/`-staging` (private, one token each); real upload test runs in CI |
| A0.8 | Resend domain verification + test email | Todo | |
| A0.9 | Twilio Verify connected to Supabase phone auth; test numbers for dev | Todo | |
| A0.10 | Stripe test mode keys + webhook endpoint | Todo | |
| A0.11 | Sentry + PostHog connected | Todo | |
| A0.12 | `activity_events` table + `logEvent()` helper (PRD T0.6) | Todo | |
| A0.13 | Connect desinetwork.co to Cloudflare DNS; `staging.desinetwork.co` → Vercel staging | Todo | |
| A0.14 | Responsive check in CI: Playwright runs e2e tests at 375px and 1440px | Done | Covered by A0.6: CI runs Playwright at 375px and 1440px |

## MVP 0 — Foundation
| ID | Task | Status | PR / notes |
|---|---|---|---|
| T0.1 | Set up repo, branching, environments (dev/staging/prod), CI pipeline | Todo | |
| T0.2 | Create city master data (city name, state label, slug); seed the 11 launch cities | In progress | Data + seed done in A0.3; "sortable and searchable" list is the city picker (T0.5) |
| T0.3 | Create category taxonomy + per-category field definitions (Section 4.1) | Done | Covered by A0.3 (categories, subcategories, fields) |
| T0.4 | Base layout: header (logo, city picker, Post Ad button), footer, responsive grid | Todo | |
| T0.5 | City picker (FR-LOC-1) | Todo | |
| T0.6 | Event logging hook: record key events (view, search, post, contact) in a standard format | Todo | |
| T0.7 | Static pages: About, Terms, Privacy, Prohibited Items, Safety Tips | Todo | |

## MVP 1 — Post & Browse
| ID | Task | Status | PR / notes |
|---|---|---|---|
| T1.1 | Listing data model with states (FR-LST-5) | Todo | |
| T1.2 | Post Ad form – step 1: choose category/subcategory | Todo | |
| T1.3 | Post Ad form – step 2: common fields (title, description, price, city) with validation | Todo | |
| T1.4 | Post Ad form – step 3: dynamic category fields (FR-CAT-2) | Todo | |
| T1.5 | Photo upload (max 8, max 10 MB each, jpg/png/webp), resize, reorder, pick cover | Todo | |
| T1.6 | Preview & submit | Todo | |
| T1.7 | Category listing page (cards: photo, title, price, city, age) | Todo | |
| T1.8 | Listing detail page (FR-LST-2) | Todo | |
| T1.9 | Home page: category grid + latest 20 listings in city | Todo | |
| T1.10 | Auto-expiry job (FR-LST-4) | Todo | |

## MVP 2 — Accounts & Dashboard
| ID | Task | Status | PR / notes |
|---|---|---|---|
| T2.1 | Sign up / login (email OTP or password) | Todo | |
| T2.2 | Google sign-in | Todo | |
| T2.3 | Email verification gate for posting (FR-ACC-2) | Todo | |
| T2.3b | Phone (SMS OTP) verification gate for posting (FR-ACC-3) | Todo | |
| T2.4 | Link listings to owner; guests can browse but not post | Todo | |
| T2.5 | Profile page (FR-ACC-4) | Todo | |
| T2.6 | My Ads dashboard (FR-ACC-5) | Todo | |
| T2.7 | Edit / Mark sold / Delete / Renew listing (FR-LST-3, 4) | Todo | |
| T2.8 | Delete account (FR-ACC-6) | Todo | |
| T2.9 | Transactional emails (FR-NTF-1, except messages) | Todo | |

## MVP 3 — Search & Filters
| ID | Task | Status | PR / notes |
|---|---|---|---|
| T3.1 | Keyword search in selected city (FR-SRC-1) | Todo | |
| T3.2 | Common filters (FR-SRC-2) | Todo | |
| T3.3 | Sort options (FR-SRC-4) | Todo | |
| T3.4 | Filters in URL (shareable/bookmarkable) | Todo | |
| T3.5 | Pagination / infinite scroll (FR-SRC-5) | Todo | |
| T3.6 | Category-specific filters (FR-SRC-3) | Todo | |
| T3.7 | Empty & no-result states with suggestions | Todo | |
| T3.8 | Performance check | Todo | |

## MVP 4 — Contact & Engagement
| ID | Task | Status | PR / notes |
|---|---|---|---|
| T4.1 | "Contact seller" → start conversation (FR-MSG-1) | Todo | |
| T4.2 | Inbox: conversation list + thread view (FR-MSG-2) | Todo | |
| T4.3 | Email notification on new message | Todo | |
| T4.4 | Optional phone/WhatsApp display (FR-MSG-3) | Todo | |
| T4.5 | Save/favorite listing (FR-MSG-4) | Todo | |
| T4.6 | Saved search + email alerts (FR-MSG-5) | Todo | |
| T4.7 | Block user (FR-MSG-6) | Todo | |
| T4.8 | Share listing with preview (FR-LST-6) | Todo | |

## MVP 5 — Trust, Safety & Admin
| ID | Task | Status | PR / notes |
|---|---|---|---|
| T5.1 | Report listing/user (FR-TSM-1) | Todo | |
| T5.2 | Admin login + roles (FR-ADM-1) | Todo | |
| T5.3 | Moderation queue (FR-TSM-2) | Todo | |
| T5.4 | Submit-time rule checks (FR-TSM-3) | Todo | |
| T5.5 | New-user review rule (FR-TSM-4) | Todo | |
| T5.6 | User management: suspend/ban (FR-ADM-2) | Todo | |
| T5.7 | Audit log (FR-ADM-5) | Todo | |
| T5.8 | Moderation interface designed as a pluggable "check" pipeline (see 8.2) | Todo | |
| T5.9 | Admin: manage categories, fields, cities, banned words (FR-ADM-3) | Todo | |

## MVP 6 — Monetization
| ID | Task | Status | PR / notes |
|---|---|---|---|
| T6.1 | Pricing config for Featured ($9.99/7 days) / Bump ($2.99) — admin-editable | Todo | |
| T6.2 | Payment provider integration (checkout, webhooks, refunds) | Todo | |
| T6.3 | Featured ad placement (FR-MON-1) | Todo | |
| T6.4 | Bump ad (FR-MON-2) | Todo | |
| T6.5 | Receipts & payment history in dashboard | Todo | |
| T6.6 | Admin revenue report (FR-ADM-4) | Todo | |

## MVP 7 — Community Extensions (required for v1)
| ID | Task | Status | PR / notes |
|---|---|---|---|
| T7.1 | Events: submit, approve, list by city/date (FR-COM-1) | Todo | |
| T7.2 | Business directory: profile, category, hours, contact (FR-COM-2) | Todo | |
| T7.3 | Business reviews & ratings | Todo | |
| T7.4 | Weekly city newsletter (FR-COM-3) | Todo | |

## MVP 8 — AI (search first: T8.A1–A3)
| ID | Task | Status | PR / notes |
|---|---|---|---|
| T8.A1 | AI search → filters: convert a natural-language query into structured filters (e.g., "room near Edison unde… | Todo | |
| T8.A2 | AI-ranked results: semantic + relevance ranking (meaning, not just keywords), with "Did you mean / related"… | Todo | |
| T8.A3 | Search evaluation set + logging dashboard (queries, filters chosen, clicks) | Todo | |
| T8.1 | Smart Post: generate title/description from photos + few words; suggest category & fields | Todo | |
| T8.2 | Price suggestion based on similar listings | Todo | |
| T8.4 | AI moderation: scam/spam/prohibited/discriminatory-language detection, image checks | Todo | |
| T8.5 | Recommendations ("similar listings", "you may like") | Todo | |
| T8.6 | Chat assistant for buyers (Q&A on a listing) and smart reply suggestions | Todo | |
| T8.7 | Translation (Hindi, Tamil, Telugu, Gujarati, Punjabi ↔ English) | Todo | |
| T8.8 | Duplicate & fraud detection across text and images | Todo | |

