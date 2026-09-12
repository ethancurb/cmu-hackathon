Drop the three licensed woff2 files here, exactly named:

- `PPEditorialNew-Regular.woff2`
- `PPFraktionMono-Regular.woff2`
- `PPFraktionMono-Bold.woff2`

Wired in `app/fonts.ts` via `next/font/local`. Until these exist, `next dev` / `next build` will fail to resolve them.
