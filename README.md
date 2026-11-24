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
