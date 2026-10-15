# DIYGH Store

A static React storefront for DIYGH — Ghana's DIY electronics and maker hub.
Boards, sensors, motors, kits. Checkout happens on WhatsApp; there is no payment backend
and no customer accounts. The **frontend is static** (Vite + React on Vercel) and the
**backend is Supabase** (products, reviews, settings, image storage).

## Prerequisites

- Node.js 20+ and npm
- A Supabase project (only needed for the live store — the app runs on seed data without it)

## Run Locally

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + anon key
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

Without `.env.local` the site still runs: it falls back to the seed catalog, local
reviews, and default settings.

## Checks

```bash
npm run lint        # ESLint over src/
npm run typecheck   # tsc with checkJs over src/
npm test            # node --test unit tests for the catalog + helpers
npm run build       # production build to dist/
```

Run all four before considering a change done.

## Project layout

- `src/data/products.js` — the seed product catalog (fallback + source for the first Supabase import).
- `src/api/catalog.js` — async `listProducts` / `getProduct` used by the pages. Reads the Supabase `products` table when configured, otherwise the localStorage overlay + seed data.
- `src/lib/supabase.js` — Supabase client built from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; `isSupabaseConfigured()` tells the rest of the app which mode it is in.
- `src/lib/auth.js` — admin sign-in/out/session helpers (Supabase email + password).
- `src/lib/config.js` — store name, WhatsApp number, currency, price/message helpers.
- `src/lib/settings.js` — editable tagline + announcement; cached in localStorage, loaded from the Supabase `settings` table at boot.
- `src/lib/reviews.js` — per-product customer reviews (Supabase `reviews` table when configured, localStorage otherwise).
- `src/lib/asset.js` — resolves `public/` asset paths against Vite `BASE_URL` for sub-path hosting.
- `src/lib/product-image.js` — generates placeholder product images as local SVG data URIs.
- `src/pages/` — Home, Shop, ProductDetail, Cart, About, Contact, Tutorials, Admin, PageNotFound.
- `src/components/` — layout, header (announcement + ticker), footer, product card (rating + compare), cart bar, search terminal.
- `src/components/ui/` — small local UI kit (toast + image). More shadcn components can be added later with `npx shadcn add <component>` (`components.json` is already configured).
- `public/images/products/` — real product photos (referenced via `image_url`, e.g. `/images/products/arduino-nano.jpg`).
- `public/images/guides/` — reference charts shown on the Tutorials page.

## Editing store details

- **WhatsApp number, store name, currency** — top of `src/lib/config.js`.
- **Tagline & announcement banner** — Admin page (`#/console`), saved to the Supabase `settings` row.
- **Products** — Admin page (`#/console`), signed in. Edits save straight to the `products` table; `src/data/products.js` is only the seed/fallback.
- **Product photos** — upload from the Admin product form (goes to the `product-images` Storage bucket), or paste an existing `/images/products/…` path.

## Admin access

The Admin page is locked behind Supabase Auth:

1. Supabase → **Authentication → Users → Add user** (email + password, auto-confirm).
2. Open `#/console` and sign in. Only signed-in admins can write products/settings or upload images.

## Reviews

Anyone can post a review — no account needed (`reviews` insert policy). Reviews can't be
edited; only the signed-in admin can delete them. Without Supabase they stay in
`localStorage` (`diygh.reviews.v1`).

## Supabase setup

1. Paste `supabase/schema.sql` into **SQL Editor** → Run (tables `products`, `reviews`,
   `settings` + the public `product-images` bucket).
2. Create the admin user (see above).
3. Fill `.env.local` with the Project URL and `anon public` key.
4. Open `#/console`, sign in, then import `diygh-catalog.json` (Admin → Import). To
   regenerate it from the seed file:
   `node --input-type=module -e "import {products} from './src/data/products.js'; import {writeFileSync} from 'node:fs'; writeFileSync('diygh-catalog.json', JSON.stringify(products,null,2))"`.
5. Add the same two values to the Vercel project (**Settings → Environment Variables**)
   so production builds inline them — see below.

## Build & deploy

`npm run build` emits `dist/`. The app uses **HashRouter** and `base: "./"`, so it works from any static host with no rewrite rules.

### Vercel

1. Push this repo to GitHub.
2. At [vercel.com/new](https://vercel.com/new), import the repo (Vite preset:
   build `npm run build`, output `dist` — both are auto-detected).
3. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   (Project → Settings → Environment Variables), then redeploy.
4. Every push to `master` now deploys automatically. Run `npm run lint`,
   `npm run typecheck`, `npm test`, and `npm run build` before pushing — Vercel
   does not run them for you.

### Other hosts

Netlify, Cloudflare Pages, GitHub Pages, etc.: build command `npm run build`, output `dist/`.
