# PRD — Community Classifieds Platform: **Desinetwork**

| Field | Value |
|---|---|
| Version | **1.0 (Frozen)** — all decisions D1–D10 applied; see Section 12 |
| Date | 24 Nov 2026 |
| Owner | Product |
| Status | Requirements gathering → Review → Tech stack & architecture |
| Reference | eknazar.com (South Asian community portal with Classifieds, Events, Yellow Pages, Movies, Coupons) |

> **How to use this doc:** Sections 1–5 explain *what* and *why*. Section 6 is the **build plan**: MVPs broken into small tasks, each with an ID and acceptance criteria you can test before moving on. Tech stack and architecture are intentionally **not** decided here.

---

## 1. Background & Reference Analysis

**eknazar.com** is a South Asian (Indian/Desi) community portal serving 45+ cities in the US, Canada, UK and Asia. Classifieds is one section among Events, Movies, Yellow Pages, Coupons, Topics (recipes, jokes, news) and a newsletter. Each city has its own local section.

**What we keep from the reference**
- City-first experience ("Select your City") — listings are local.
- Community focus: roommates, rentals, jobs, buy/sell, services aimed at the diaspora.
- Free ad posting as the default.
- Later: Events and a business directory (Yellow Pages) as natural extensions.

**Where we improve**
- A dedicated, modern classifieds experience (eknazar's classifieds are thin; no visible search, filters or listing detail).
- Mobile-first, fast search with filters.
- Trust & safety: verified users, reporting, moderation.
- Clear monetization (featured/bumped ads) instead of only banner ads.
- Designed from day one to plug in AI (smart posting, search, moderation, recommendations).

---

## 2. Goals, Non-Goals, Success Metrics

### 2.1 Goals
1. Let a user post a free classified ad in **under 2 minutes**.
2. Let a user find a relevant local listing in **under 3 searches/clicks**.
3. Keep the marketplace clean: spam/scam ads removed quickly.
4. Build a structure (categories, attributes, events) that AI features can use later without rework.

### 2.2 Non-Goals (for MVP)
- Online payments between buyers and sellers (escrow, checkout).
- Native mobile apps (responsive web first).
- Content portal sections (movies, recipes, jokes, horoscope).
- Matrimonial listings — **permanently out of scope** (decision D6).
- Markets outside the US (decision D2).

### 2.3 Success Metrics (first 90 days after launch)
| Metric | Target |
|---|---|
| Time to post an ad (median) | < 2 min |
| Ads posted / week | Baseline then +10% week over week |
| Search → listing-view rate | > 40% |
| Listing → contact rate | > 8% |
| Reported ads reviewed within | 24 h |
| Spam ads live > 24 h | < 1% |

---

## 3. Users & Personas

| Persona | Need | Key features |
|---|---|---|
| **Newcomer / Student** (e.g., just moved to Edison, NJ) | Room, roommate, used furniture, carpool | Roommates/Rentals, Buy/Sell, city filter |
| **Working Professional** | Sell car/furniture before relocating; find jobs | Fast posting, photos, dashboard |
| **Family** | Babysitter, tutor, cook, home services | Services category, trust signals |
| **Small Business Owner** | Promote services (tax prep, catering, real estate) | Business profile, featured ads |
| **Moderator / Admin** | Keep platform clean, manage categories | Admin panel, report queue |

**Roles:** Guest (browse only) · Registered User (post, message, save) · Business User (later) · Moderator · Admin.

---

## 4. Scope Overview

### 4.1 Categories (initial taxonomy — configurable by admin)
| Category | Example subcategories | Category-specific fields |
|---|---|---|
| Roommates & Rentals | Room for rent, Roommate wanted, Apartment, Sublet | Rent, deposit, available date, gender preference, food preference (veg/non-veg), furnished, utilities included |
| Real Estate | House for sale, Condo, Commercial | Price, beds, baths, sq ft |
| Jobs | Full-time, Part-time, Contract, Internship | Job type, salary range, visa sponsorship (Y/N), remote/onsite |
| Buy & Sell | Furniture, Electronics, Appliances, Kids items, Free stuff | Price, condition, negotiable |
| Autos | Cars, Bikes | Make, model, year, mileage, price |
| Services | Babysitting/Nanny, Tutoring, Cooking/Tiffin, Tax/Accounting, Immigration, Cleaning, Beauty | Service area, rate |
| Community | Carpool, Travel companion, Lost & found, Announcements | Date, route (carpool) |

### 4.2 Location model
**City-only at launch (D9).** Users pick a city (metro); there is no country or region selection in the UI. Each city record stores its state for display (e.g., "Pittsburgh, PA"). Global scope (countries/regions) is a later phase; the data model should allow adding a country field later without migrating listings. User selects a city once; it is remembered. Listings belong to exactly one city. Optional: zip/postal code for distance search (later MVP).

### 4.3 MVP Roadmap (summary)
| MVP | Theme | Outcome |
|---|---|---|
| **MVP 0** | Foundation | Project skeleton, environments, master data (cities, categories) |
| **MVP 1** | Post & browse | Users can post an ad and anyone can browse/view it |
| **MVP 2** | Accounts & dashboard | Sign up/login, manage my ads, profile |
| **MVP 3** | Search & filters | Keyword search, category filters, sort |
| **MVP 4** | Contact & engagement | In-app messaging, saved ads, alerts |
| **MVP 5** | Trust, safety & admin | Reporting, moderation queue, admin panel |
| **MVP 6** | Monetization | Featured/bumped ads, paid plans |
| **MVP 7** | Community extensions | Events, Business directory (Yellow Pages) — **required for v1 launch**; can be built in parallel with MVP 6 (D8) |
| **MVP 8** | AI features | Priority 1–2: AI search filters + AI-ranked results (D7); rest later |

---

## 5. Functional Requirements (by module)

IDs: `FR-<module>-<n>`. Priority: **P0** = must for launch, **P1** = soon after, **P2** = later.

### 5.1 Location (LOC)
- **FR-LOC-1 (P0)** User can select a city from a searchable list; selection persists across visits.
- **FR-LOC-2 (P0)** All listing pages are filtered by the selected city by default.
- **FR-LOC-3 (P1)** Auto-suggest nearest city from browser location (with permission).
- **FR-LOC-4 (P2)** Search within radius of a zip/postal code.

### 5.2 Categories (CAT)
- **FR-CAT-1 (P0)** Two-level taxonomy: category → subcategory.
- **FR-CAT-2 (P0)** Each category defines its own extra fields (type, required, options).
- **FR-CAT-3 (P1)** Admin can add/edit/disable categories and fields without code changes.

### 5.3 Listings (LST)
- **FR-LST-1 (P0)** Create listing: title, description, category, subcategory, city, price (optional), category fields, photos (up to 8), contact preference.
- **FR-LST-2 (P0)** Listing detail page: photos, details, posted date, city, seller display name, contact action.
- **FR-LST-3 (P0)** Edit, mark as sold/filled, delete own listing.
- **FR-LST-4 (P0)** Listings expire after 30 days (configurable); owner can renew.
- **FR-LST-5 (P0)** Listing states: Draft → Pending review → Active → Expired / Sold / Removed.
- **FR-LST-6 (P1)** Shareable URL with preview (title, photo, price) for WhatsApp/social.
- **FR-LST-7 (P1)** View count shown to owner.

### 5.4 Accounts (ACC)
- **FR-ACC-1 (P0)** Sign up / log in with email + one-time code or password; Google sign-in.
- **FR-ACC-2 (P0)** Email verification required before posting.
- **FR-ACC-3 (P0)** Phone verification (SMS OTP, US numbers only) is **required before posting** any ad (D3); verified users get a "Verified" badge.
- **FR-ACC-4 (P0)** Profile: display name, photo, city, member since.
- **FR-ACC-5 (P0)** "My Ads" dashboard: list by status, edit, renew, mark sold, delete.
- **FR-ACC-6 (P0)** Delete account and personal data.

### 5.5 Search & Discovery (SRC)
- **FR-SRC-1 (P0)** Keyword search across title and description within selected city.
- **FR-SRC-2 (P0)** Filters: category, subcategory, price range, posted date, has photos.
- **FR-SRC-3 (P1)** Category-specific filters (e.g., rent range, veg-only, visa sponsorship).
- **FR-SRC-4 (P0)** Sort: newest, price low→high, price high→low.
- **FR-SRC-5 (P0)** Paginated / infinite-scroll results with card view.
- **FR-SRC-6 (P1)** Home page: categories grid, recent listings, featured listings.

### 5.6 Messaging & Engagement (MSG)
- **FR-MSG-1 (P0)** Contact seller via in-app message (email/phone hidden by default).
- **FR-MSG-2 (P0)** Inbox with conversations grouped by listing; email notification on new message.
- **FR-MSG-3 (P1)** Option for seller to show phone/WhatsApp on listing.
- **FR-MSG-4 (P1)** Save/favorite listings.
- **FR-MSG-5 (P1)** Saved search alerts (email digest).
- **FR-MSG-6 (P1)** Block a user.

### 5.7 Trust, Safety & Moderation (TSM)
- **FR-TSM-1 (P0)** Report listing / user with reason (spam, scam, prohibited, wrong category, offensive).
- **FR-TSM-2 (P0)** Moderation queue: approve, reject (with reason), remove, warn/ban user.
- **FR-TSM-3 (P0)** Rule-based checks on submit: banned words, duplicate detection, posting rate limit.
- **FR-TSM-4 (P0)** New users' first N ads go to review queue (configurable).
- **FR-TSM-5 (P0)** Safety tips shown on listing and in chat (meet in public, never wire money).
- **FR-TSM-6 (P0)** Prohibited items policy + Terms of Use + Privacy Policy pages.
- **FR-TSM-7 (P1)** Housing ads must not include discriminatory language (Fair Housing compliance check).

### 5.8 Admin (ADM)
- **FR-ADM-1 (P0)** Admin login with role-based access (Admin, Moderator).
- **FR-ADM-2 (P0)** Manage users (search, view, suspend, ban).
- **FR-ADM-3 (P1)** Manage cities, categories, fields, banned words.
- **FR-ADM-4 (P1)** Dashboard: new ads, active users, reports, revenue.
- **FR-ADM-5 (P0)** Audit log of all moderator actions.

### 5.9 Monetization (MON)
- **FR-MON-0 (P0)** Basic posting is free in all categories. **Jobs: employers post job descriptions free** (D4).
- **FR-MON-1 (P1)** Featured ad (pinned top of category for N days). Proposed launch price: **$9.99 / 7 days** (admin-editable, D5).
- **FR-MON-2 (P1)** Bump ad (move to top of "newest" once). Proposed launch price: **$2.99 per bump** (admin-editable, D5).
- **FR-MON-3 (P1)** Online payment for upgrades via a payment provider (card details never stored by us).
- **FR-MON-4 (P2)** Business plans (monthly; multiple featured slots, business badge).
- **FR-MON-5 (P2)** Banner ad slots by city/category.

### 5.10 Community Extensions (COM) — P0 for v1 launch (D8)
- **FR-COM-1** Events: list, browse by city/date, submit event, external ticket link.
- **FR-COM-2** Business directory (Yellow Pages): business profile, category, hours, reviews.
- **FR-COM-3** Newsletter: weekly city digest of new listings and events.

### 5.11 Notifications (NTF)
- **FR-NTF-1 (P0)** Email: verification, ad approved/rejected, new message, ad expiring in 3 days.
- **FR-NTF-2 (P1)** User controls notification preferences.

---

## 6. Build Plan — MVPs & Tasks

Each task is small enough to build and test on its own. **Do not start the next task until its acceptance criteria (AC) pass.**

### MVP 0 — Foundation
| ID | Task | Acceptance criteria |
|---|---|---|
| T0.1 | Set up repo, branching, environments (dev/staging/prod), CI pipeline | Push to main runs build + tests; staging deploy works |
| T0.2 | Create city master data (city name, state label, slug); seed the 11 launch cities | Cities load from DB; list is sortable and searchable |
| T0.3 | Create category taxonomy + per-category field definitions (Section 4.1) | All 7 categories and subcategories retrievable with their fields |
| T0.4 | Base layout: header (logo, city picker, Post Ad button), footer, responsive grid | Renders correctly on 375px mobile and 1440px desktop |
| T0.5 | City picker (FR-LOC-1) | Selecting a city persists after page reload |
| T0.6 | Event logging hook: record key events (view, search, post, contact) in a standard format | Each event stored with user/session, city, category, timestamp |
| T0.7 | Static pages: About, Terms, Privacy, Prohibited Items, Safety Tips | Pages reachable from footer |

### MVP 1 — Post & Browse
| ID | Task | Acceptance criteria |
|---|---|---|
| T1.1 | Listing data model with states (FR-LST-5) | Listing can move through all defined states; invalid transitions blocked |
| T1.2 | Post Ad form – step 1: choose category/subcategory | Only active categories shown |
| T1.3 | Post Ad form – step 2: common fields (title, description, price, city) with validation | Title 10–100 chars, description 30–5000 chars; errors shown inline |
| T1.4 | Post Ad form – step 3: dynamic category fields (FR-CAT-2) | Fields change per category; required fields enforced |
| T1.5 | Photo upload (max 8, max 10 MB each, jpg/png/webp), resize, reorder, pick cover | Upload, reorder, delete work; oversized files rejected with message |
| T1.6 | Preview & submit | User sees preview; on submit listing is Active (or Pending if review rule applies) |
| T1.7 | Category listing page (cards: photo, title, price, city, age) | Shows only Active listings for selected city + category, newest first |
| T1.8 | Listing detail page (FR-LST-2) | All fields, photo gallery, safety tips visible |
| T1.9 | Home page: category grid + latest 20 listings in city | Correct city filter applied |
| T1.10 | Auto-expiry job (FR-LST-4) | Listing older than 30 days becomes Expired and disappears from browse |

### MVP 2 — Accounts & Dashboard
| ID | Task | Acceptance criteria |
|---|---|---|
| T2.1 | Sign up / login (email OTP or password) | New user can register, log in, log out |
| T2.2 | Google sign-in | Login with Google creates/links account |
| T2.3 | Email verification gate for posting (FR-ACC-2) | Unverified user is prompted to verify before submitting an ad |
| T2.3b | Phone (SMS OTP) verification gate for posting (FR-ACC-3) | User without a verified US phone cannot submit an ad; after OTP success the "Verified" badge shows; OTP retries rate-limited |
| T2.4 | Link listings to owner; guests can browse but not post | Guest clicking "Post Ad" is redirected to login and back |
| T2.5 | Profile page (FR-ACC-4) | User can edit name/photo/city; public profile shows active ads |
| T2.6 | My Ads dashboard (FR-ACC-5) | Tabs: Active, Pending, Expired, Sold; actions work per status |
| T2.7 | Edit / Mark sold / Delete / Renew listing (FR-LST-3, 4) | Each action updates status and is reflected on public pages |
| T2.8 | Delete account (FR-ACC-6) | Account and ads removed; user can no longer log in |
| T2.9 | Transactional emails (FR-NTF-1, except messages) | Verification, approved/rejected, expiring-soon emails received |

### MVP 3 — Search & Filters
| ID | Task | Acceptance criteria |
|---|---|---|
| T3.1 | Keyword search in selected city (FR-SRC-1) | Searching "sofa" returns listings with "sofa" in title/description |
| T3.2 | Common filters (FR-SRC-2) | Each filter narrows results correctly; filters combine (AND) |
| T3.3 | Sort options (FR-SRC-4) | Results ordered correctly for each option |
| T3.4 | Filters in URL (shareable/bookmarkable) | Copying URL into new tab shows same results |
| T3.5 | Pagination / infinite scroll (FR-SRC-5) | No duplicates or gaps across pages |
| T3.6 | Category-specific filters (FR-SRC-3) | e.g., Rentals: rent range + veg-only works |
| T3.7 | Empty & no-result states with suggestions | Shows "no results" with tips and link to post an ad |
| T3.8 | Performance check | Search results return in < 1 s at 10k listings |

### MVP 4 — Contact & Engagement
| ID | Task | Acceptance criteria |
|---|---|---|
| T4.1 | "Contact seller" → start conversation (FR-MSG-1) | Message delivered; seller's email/phone not exposed |
| T4.2 | Inbox: conversation list + thread view (FR-MSG-2) | Unread count correct; messages ordered by time |
| T4.3 | Email notification on new message | Recipient gets email with link to thread |
| T4.4 | Optional phone/WhatsApp display (FR-MSG-3) | Shown only if seller opted in; "click to reveal" logged |
| T4.5 | Save/favorite listing (FR-MSG-4) | Saved list in dashboard; removed when listing expires |
| T4.6 | Saved search + email alerts (FR-MSG-5) | Daily email contains only new matching listings |
| T4.7 | Block user (FR-MSG-6) | Blocked user cannot message you |
| T4.8 | Share listing with preview (FR-LST-6) | WhatsApp/social shows title, photo, price |

### MVP 5 — Trust, Safety & Admin
| ID | Task | Acceptance criteria |
|---|---|---|
| T5.1 | Report listing/user (FR-TSM-1) | Report saved with reason; user sees confirmation |
| T5.2 | Admin login + roles (FR-ADM-1) | Moderator cannot access admin-only pages |
| T5.3 | Moderation queue (FR-TSM-2) | Approve/reject/remove updates listing; owner notified with reason |
| T5.4 | Submit-time rule checks (FR-TSM-3) | Banned word → Pending; duplicate ad blocked; > X ads/day blocked |
| T5.5 | New-user review rule (FR-TSM-4) | First 2 ads of new user go to Pending |
| T5.6 | User management: suspend/ban (FR-ADM-2) | Banned user cannot log in or post; ads hidden |
| T5.7 | Audit log (FR-ADM-5) | Every moderator action recorded with who/what/when |
| T5.8 | Moderation interface designed as a pluggable "check" pipeline (see 8.2) | New check can be added without changing the queue UI |
| T5.9 | Admin: manage categories, fields, cities, banned words (FR-ADM-3) | Changes visible on site without deploy |

### MVP 6 — Monetization
| ID | Task | Acceptance criteria |
|---|---|---|
| T6.1 | Pricing config for Featured ($9.99/7 days) / Bump ($2.99) — admin-editable | Admin changes price and duration; new price applies to new purchases immediately, no code deploy; past purchases keep their original price; change recorded in audit log; Jobs basic posting stays free |
| T6.2 | Payment provider integration (checkout, webhooks, refunds) | Test payment upgrades listing; failed payment does not |
| T6.3 | Featured ad placement (FR-MON-1) | Featured shown at top with badge for N days, then reverts |
| T6.4 | Bump ad (FR-MON-2) | Listing moves to top of newest once |
| T6.5 | Receipts & payment history in dashboard | User can view/download receipts |
| T6.6 | Admin revenue report (FR-ADM-4) | Totals match payment provider |

### MVP 7 — Community Extensions (required for v1 launch; may run in parallel with MVP 6)
| ID | Task | Acceptance criteria |
|---|---|---|
| T7.1 | Events: submit, approve, list by city/date (FR-COM-1) | Past events auto-hidden |
| T7.0 | Note: Featured/Bump upgrades from MVP 6 can later be extended to Events and Business listings | — |
| T7.2 | Business directory: profile, category, hours, contact (FR-COM-2) | Searchable by city + category |
| T7.3 | Business reviews & ratings | One review per user per business; reportable |
| T7.4 | Weekly city newsletter (FR-COM-3) | Subscribers receive digest; unsubscribe works |

### MVP 8 — AI Features (built on hooks from earlier MVPs)

**Priority (D7): AI for search filters and search results comes first.**

| ID | Task | Acceptance criteria |
|---|---|---|
| T8.A1 | **AI search → filters**: convert a natural-language query into structured filters (e.g., "room near Edison under 900 veg only" → category=Rentals, city=Edison, rent≤900, food=veg) and show them as editable filter chips | ≥ 90% of a 100-query test set produce correct filters; user can remove/edit any chip; falls back to keyword search on failure |
| T8.A2 | **AI-ranked results**: semantic + relevance ranking (meaning, not just keywords), with "Did you mean / related" suggestions and smart zero-result recovery | Top-5 relevance on test set beats keyword baseline; zero-result rate drops by ≥ 30%; results still respect all filters |
| T8.A3 | Search evaluation set + logging dashboard (queries, filters chosen, clicks) | Test set of 100+ real-style queries exists; click-through per query visible |

**Later AI features (after T8.A1–A3):**

| ID | Feature | Value | Depends on |
|---|---|---|---|
| T8.1 | **Smart Post**: generate title/description from photos + few words; suggest category & fields | Faster posting, better quality | Category field schema (T0.3), photo pipeline (T1.5) |
| T8.2 | **Price suggestion** based on similar listings | Fair pricing, faster sales | Structured price/attributes, sold status |
| T8.4 | **AI moderation**: scam/spam/prohibited/discriminatory-language detection, image checks | Lower moderator load | Pluggable check pipeline (T5.8) |
| T8.5 | **Recommendations** ("similar listings", "you may like") | Engagement | Event logging (T0.6) |
| T8.6 | **Chat assistant** for buyers (Q&A on a listing) and smart reply suggestions | Faster responses | Messaging (MVP 4) |
| T8.7 | **Translation** (Hindi, Tamil, Telugu, Gujarati, Punjabi ↔ English) | Reach & inclusion | Text fields stored with language tag |
| T8.8 | **Duplicate & fraud detection** across text and images | Trust | Photo hashing, event logs |

---

## 7. Non-Functional Requirements
| Area | Requirement |
|---|---|
| Performance | Page load < 2.5 s on 4G; search < 1 s at 100k listings |
| Availability | 99.5% uptime (MVP), 99.9% later |
| Scalability | Launch with 11 cities; support 50+ cities (and later countries), 500k listings, 100k monthly users without redesign |
| Security | HTTPS everywhere; hashed passwords; rate limiting; OWASP Top 10 covered; no card data stored |
| Privacy | US: CCPA/CPRA (California) and other state privacy laws; consent, data export, deletion |
| Accessibility | WCAG 2.1 AA |
| SEO | Server-rendered listing and category pages, clean URLs (`/edison-nj/rentals/room-for-rent/<slug>`), sitemap |
| Mobile | Mobile-first responsive design; PWA later |
| Localization | English at launch; all UI text externalized for later languages |
| Observability | Error tracking, uptime monitoring, basic analytics dashboard |
| Backups | Daily DB backups, 30-day retention, tested restore |

---

## 8. Data & AI-Readiness (decisions to make now, so AI is easy later)

### 8.1 Core entities (conceptual)
`User`, `Role`, `City` (name, state label, slug; country added later), `Category`, `Subcategory`, `CategoryField`, `Listing`, `ListingAttribute` (field values), `ListingPhoto`, `Conversation`, `Message`, `SavedListing`, `SavedSearch`, `Report`, `ModerationAction`, `Payment`, `Upgrade` (featured/bump), `Event`, `Business`, `Review`, `ActivityEvent` (analytics log).

### 8.2 AI-readiness principles
1. **Structured attributes** — store category fields as typed data, not just free text. AI can fill and read them.
2. **Event log from day one (T0.6)** — views, searches, contacts, saves. This is the training/feedback data for recommendations and ranking.
3. **Search behind an interface** — keyword search now; semantic/vector search can be swapped in later without changing the UI.
4. **Moderation as a pipeline of "checks"** — rules today; an AI check is just another step that returns `allow / review / block` with a reason and confidence.
5. **Content generation as optional assist** — posting form accepts "suggested values" so AI suggestions can pre-fill fields that the user confirms.
6. **Language tag on text fields** — enables translation later.
7. **Human in the loop** — AI never auto-bans users; low-confidence decisions go to moderators. All AI decisions are logged and explainable.
8. **AI provider-agnostic** — all AI calls go through one internal service layer, so models/providers can change.

---

## 9. Assumptions
- **US only, city-focused at launch** (D2, D9). **11 confirmed launch cities:** Edison NJ, New York City, San Francisco Bay Area, Dallas, Houston, Chicago, Atlanta, Seattle, Washington DC, Raleigh, Pittsburgh.
- Posting is free (including employer job posts); revenue from Featured/Bump starts in MVP 6.
- English-only UI at launch.
- Phone verification uses an SMS provider; US numbers only.
- Small moderation team (1–2 people) at launch.

## 10. Risks
| Risk | Mitigation |
|---|---|
| Cold start (no listings) | Seed launch cities; partner with community groups, student associations, temples |
| Scams (fake rentals, advance-fee) | Hidden contact info, in-app chat, safety tips, verified badges, AI fraud detection later |
| Housing discrimination liability | Fair Housing language checks + moderation |
| Spam bots | Rate limits, verification, CAPTCHA via provider, duplicate detection |
| Phone verification adds friction at posting | Verify once per account; clear "why we verify" message; measure drop-off at the OTP step |
| Privacy law | US-only at launch: CCPA/CPRA and state privacy laws; legal review |

## 11. Out of Scope (this version)
Payments between users, native apps, matrimonial, movies/recipes/jokes content, auctions, delivery/logistics.

## 12. Decisions Log (review of 24 Nov 2026)
| # | Question | Decision |
|---|---|---|
| D1 | Brand name | **Desinetwork** |
| D2 | Launch markets | **US only** |
| D3 | Phone verification to post | **Yes — required** |
| D4 | Jobs pricing | **Free for employers** to post job descriptions |
| D5 | Featured / Bump pricing | **Yes, offer both** — proposed $9.99/7 days and $2.99/bump (admin-editable) |
| D6 | Matrimonial | **No — out of scope** |
| D7 | Top AI priority | **AI search filters and search results** (T8.A1–A3) |
| D8 | Events & Business Directory | **Required regardless** — in v1 launch scope, independent of monetization timing |
| D9 | Launch cities & location scope | **11 cities confirmed** (10 proposed + Pittsburgh). **City-only focus**; global scope (countries) added later |

| D10 | Featured / Bump launch prices | **Confirmed: $9.99 / 7 days (Featured), $2.99 per bump.** Admins can change prices anytime in the admin panel (T6.1) without a code release |
| D11 | Master data defaults (A0.3) | City slugs are `<city>-<state>` (e.g. `edison-nj`, `sf-bay-area-ca`, `washington-dc`). Category slugs: `rentals`, `real-estate`, `jobs`, `buy-sell`, `autos`, `services`, `community`. Fields attach to a category (shared) or one subcategory. Listings have one optional price; the category's `price_label` names it and Jobs/Community have none. Field list as in `supabase/seed.sql` |
| D12 | Order of verification work | **Email sign-in codes first (A0.9e); phone verification (A0.9 setup + T2.3b) built later, just before T2.3b.** D3 still applies: a verified US phone is required to post at launch |

No open questions. Changes after v1.0 are added as new decisions in this log.

---

## 13. Next Steps
1. ~~Review PRD and resolve open questions~~ — done, PRD v1.0 frozen.
2. Decide tech stack & architecture (next doc).
3. Start MVP 0 tasks; test each task against its acceptance criteria before moving on.
