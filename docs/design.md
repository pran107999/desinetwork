# Design Reference — Desinetwork

## Mockups (Canva)
- Desktop web (9 screens): https://canva.link/u41xqmth7yrmyn6
- Mobile (6 screens): https://canva.link/eqdsmf4hk7tpad1

> Product name: **Desinetwork** (logo: "Desi" + "network" in two colors). Some sample text in the mockups (dates, prices, names) is placeholder.
> Mockups are a visual guide. If a mockup and `prd.md` disagree, follow `prd.md`.

Export each screen as PNG into `docs/design/` (e.g., `desktop-01-home.png`) so Claude Code can see them.

## Screen list → MVP
| Screen | MVP / tasks |
|---|---|
| Home (city picker, categories, featured, latest) | T0.4, T0.5, T1.9 |
| Category / search results with filters | T1.7, MVP 3 |
| Listing detail | T1.8 |
| Post Ad steps 1–3 | T1.2–T1.6 |
| My Ads dashboard | T2.6, T2.7 |
| Messages inbox + chat | T4.1, T4.2 |
| Admin moderation queue | T5.3 |

## Brand tokens
| Token | Value | Use |
|---|---|---|
| `primary` | `#F26B1D` (saffron orange) | Main buttons ("Post Free Ad", "Publish"), key actions |
| `secondary` | `#0F4C5C` (deep teal) | Header, headings, links |
| `background` | `#FAF7F2` (warm off-white) | Page background |
| `surface` | `#FFFFFF` | Cards, panels |
| `text` | `#1F2937` | Body text |
| `muted` | `#6B7280` | Secondary text, timestamps |
| `success` / `warning` / `danger` | `#16A34A` / `#D97706` / `#DC2626` | Status badges, errors |

Check that every text/background pair meets WCAG AA contrast (white text on `#F26B1D` buttons should be bold and 16px or larger, or darken the orange for small text).

## Typography
- Font: **Inter** (fallback: system sans-serif).
- Scale: 12 / 14 / 16 (body) / 18 / 24 / 32 px.

## Layout & components
- Mobile-first; breakpoints at 640, 768, 1024, 1280 px. Test at 375px and 1440px.
- Rounded corners (8–12px), soft shadows on cards.
- **Listing card:** cover photo (4:3), title (2 lines max), price, city, posted time, "Featured" badge if upgraded.
- **Mobile bottom nav:** Home, Search, Post (+), Messages, Account.
- **Desktop header:** logo, city picker, search bar, Sign in, "Post Free Ad".
- Safety-tip box on listing detail and in chat.
- Empty states with a helpful message and next action.
- Use shadcn/ui components themed with the tokens above.
