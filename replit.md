# Ramune Catcher

## Overview

A global community collector's tracker for Japanese ramune soda bottles. Users scan barcodes (JAN/EAN) to "catch" flavors, log snack spots on a shared map with prices, and connect with friends.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS v4 (Nunito font, aqua/cyan theme)
- **Routing**: wouter
- **Data fetching**: @tanstack/react-query (direct Supabase queries, no generated hooks)
- **Auth**: Supabase email/password auth
- **Database**: Supabase (PostgreSQL) — direct queries from frontend via @supabase/supabase-js
- **Maps**: react-leaflet + leaflet + react-leaflet-cluster
- **Barcode**: html5-qrcode (camera scanner) + jsbarcode (preview rendering)
- **Animations**: framer-motion

## Architecture

```
artifacts/
  ramune-catcher/      — React/Vite frontend at /
  api-server/          — Express API (legacy, no longer used by frontend)
  mockup-sandbox/      — Component preview server (dev only)
data.sql               — Complete Supabase setup SQL (paste into Supabase SQL Editor)
netlify.toml           — Netlify build config
```

## Supabase Schema

- **profiles** — id (uuid), username, display_name, is_admin, created_at
- **flavors** — id, japanese_name, name, barcode, color, brand, category, sort_order, description, image_url
- **flavor_barcodes** — id, flavor_id, barcode (unique), region, added_by, added_at
- **caught_flavors** — id, user_id (uuid), flavor_id, caught_at; unique(user_id, flavor_id)
- **locations** — id, name, city, country, lat, lng, added_by (uuid), verified, verified_by
- **location_flavors** — id, location_id, flavor_id, price, currency, added_by (uuid)
- **friendships** — id, user_id (uuid), friend_id (uuid); unique(user_id, friend_id)

## Required Secrets (Replit Secrets tab)

- `VITE_SUPABASE_URL` — Supabase project URL (Settings → API → Project URL)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon public key (Settings → API → anon public)

## Supabase Setup

1. Create a Supabase project at supabase.com
2. Paste `data.sql` into the Supabase SQL Editor and click Run
3. Add the 2 secrets above to Replit Secrets
4. After signing up in the app, run: `UPDATE public.profiles SET is_admin = true WHERE username = 'your_username';`

## Auth

Supabase email/password. On sign-up, a database trigger auto-creates a profile row. The `useAuth()` hook in `src/hooks/use-auth.ts` exposes: `user`, `profile`, `username`, `displayName`, `isAdmin`, `isReady`, `logout`, `updateDisplayName`, `refreshProfile`.

Admin check: `isAdmin` field on profile (replaces old `isTima = username === "tima"`).

## Scanning Flow

1. `html5-qrcode` camera scanner on `/catch` page scans JAN/EAN barcode
2. Barcode is looked up in `flavors.barcode` first, then `flavor_barcodes.barcode`
3. If found → show flavor card → user confirms with "Catch it!" button → saves to `caught_flavors`
4. If not found → show "New Flavor" form → user names it → saves to `flavors` + `caught_flavors`

## Netlify Deploy

- Build command: `pnpm --filter @workspace/ramune-catcher run build`
- Publish directory: `artifacts/ramune-catcher/dist/public`
- Also set env vars in Netlify: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `_redirects` file is in `artifacts/ramune-catcher/public/` (auto-copied to dist)

## Flavor Categories / Brands

- **Hata Kosen** — standard (30), limited (6), savory (6) = 42 flavors
- **Doraemon** — doraemon (8) limited edition collab
- **Sangaria** — sangaria (6)
- **Shirakiku** — other (3)
- **Asahi / Nissui** — other (2)
- **Total: 61 flavors, 17 seed barcodes**

## Pages

- `/` — Dashboard: stats, recently caught, quick barcode catch
- `/catch` — Camera scanner (JAN/EAN) + manual entry + flavor lookup + catch confirmation + new flavor form
- `/collection` — Flavor grid grouped by brand, color-coded cards, filter/search, admin barcode manager
- `/map` — Shared Leaflet map: snack spots worldwide, confirmed flavors + prices, add new spots
- `/friends` — Find and manage friends by username
- `/account` — Profile, stats, display name edit, sign out

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/ramune-catcher run build` — build frontend for deployment
