# AGENTS.md

## Project Context

ROBOHUB Store is a static Vite + React storefront deployed on Vercel, with Supabase as
its backend (products, reviews, settings, image storage, admin sign-in). Treat it as
user-owned application code, keep changes focused on the user's request, and preserve
existing project conventions.

Start with `README.md` for local setup and project layout.

## Key Files

- `src/data/products.js` — seed catalog (fallback data + source for the Supabase import).
- `src/api/catalog.js` — async product API used by pages (Supabase `products` table, seed/localStorage fallback).
- `src/lib/supabase.js` — Supabase client + `isSupabaseConfigured()` (reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).
- `src/lib/auth.js` — admin sign-in/out/session (Supabase Auth; the Admin page is gated on it).
- `src/lib/config.js` — store name, WhatsApp number, currency, message helpers.
- `src/lib/settings.js` — tagline + announcement: sync `getSettings()` cache, async `loadSettings()` / `saveSettings()`.
- `src/lib/reviews.js` — async per-product reviews (public read/insert in Supabase, localStorage fallback).
- `src/lib/asset.js` — `assetUrl()` for base-relative public assets.
- `src/lib/product-image.js` — generated SVG placeholder images.
- `vite.config.js` — Vite config with `@` → `src` alias and `base: "./"` (base-relative assets; keep it).
- `src/App.jsx` — HashRouter routes (do not switch to BrowserRouter; Pages has no SPA rewrite).

## Working Notes

- Supabase is the backend; keep RLS intact (public SELECT, public INSERT on `reviews` only,
  authenticated-only writes for `products`/`settings` and Storage). Never add the service role
  key to the frontend — only the anon key, via `VITE_*` env vars.
- Everything degrades gracefully: with no env vars the app runs on seed data + localStorage,
  which is also how the node tests run. Keep it that way.
- Real product photos live in `public/images/products/` and are referenced via each product's `image_url`;
  new photos upload to the `product-images` bucket from the Admin form.
- Guide/reference images go in `public/images/guides/` (Tutorials page).
- Admin edits save to Supabase; `#/console` requires a Supabase sign-in.
- UI components live in `src/components/ui/`; the shadcn CLI (`npx shadcn add <component>`)
  works against the existing `components.json` if more are needed.
- Default dev command: `npm run dev`.
- Image path helper: use `assetUrl()` / the `<Image>` component for anything under `public/`.

## Checks

Run all of these before finishing code changes:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
