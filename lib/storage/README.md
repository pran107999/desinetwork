# lib/storage
The only code that talks to Cloudflare R2 (CLAUDE.md §5).

- `rules.ts`: allowed types (jpg/png/webp), 10 MB limit, key format `incoming/<user>/<id>.<ext>`.
- `r2.ts` (server-only): `createUploadUrl` (signed PUT, 5 min, type + size signed), `objectExists`, `deleteObject`.
- `text.ts`: user-facing messages.

Image processing with sharp (resize, WebP, strip GPS) arrives in T1.5.
