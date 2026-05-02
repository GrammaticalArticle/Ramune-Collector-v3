# Ramune Catcher

## Overview

A global community collector's tracker for Japanese ramune soda bottles. Users scan or manually enter barcodes to "catch" flavors, log snack spots on a shared map with prices, and connect with friends.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS v4 (Nunito font, aqua/cyan theme)
- **Routing**: wouter
- **Data fetching**: @tanstack/react-query + Orval-generated hooks
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (zod/v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec → lib/api-spec/openapi.yaml)
- **Build**: esbuild (CJS bundle)
- **Maps**: react-leaflet + leaflet
- **Barcode**: html5-qrcode (camera scanner) + jsbarcode (preview)
- **Animations**: framer-motion

## Architecture

```
artifacts/
  api-server/          — Express API at /api/*
  ramune-catcher/      — React/Vite frontend at /
  mockup-sandbox/      — Component preview server (dev only)
lib/
  api-spec/            — OpenAPI spec + codegen config
  api-client-react/    — Generated React Query hooks
  api-zod/             — Generated Zod schemas
  db/                  — Drizzle ORM schema + migrations
```

## DB Schema

- **flavors** — id, japanese_name, name, barcode, color (hex), brand, category, sort_order, description
- **caught_flavors** — id, flavor_id, caught_at
- **locations** — id, name, city, country, lat, lng, added_by, created_at
- **location_flavors** — id, location_id, flavor_id, price, currency, added_by, added_at
- **users** — id, username, display_name, created_at
- **friendships** — id, username, friend_username, created_at

## Flavor Categories / Brands

- **Hata Kosen** — standard (30), limited (6), savory (6) = 42 flavors
- **Doraemon** — doraemon (8) limited edition collab
- **Sangaria** — sangaria (6)
- **Shirakiku** — other (3)
- **Asahi / Nissui** — other (2)
- **Total: 61 flavors**

## User System

No auth — username stored in localStorage (`ramune_username`, `ramune_display_name`). On first visit, a welcome modal prompts the user to set up a username which is registered in the DB.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
  - **IMPORTANT**: After codegen, immediately overwrite `lib/api-zod/src/index.ts` with `export * from "./generated/api";` (codegen regenerates it with a stale second export that doesn't exist)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only, clear data-loss tables first via SQL if needed)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Pages

- `/` — Dashboard: stats, recently caught, quick barcode catch
- `/catch` — Camera scanner + manual barcode entry with live preview + flavor lookup + catch button
- `/collection` — Flavor grid grouped by brand (Hata → Doraemon → Sangaria → others), color-coded cards, filter/search
- `/map` — Shared Leaflet map: snack spots worldwide, click pins to see confirmed flavors + prices, add new spots
- `/friends` — Find and manage friends by username

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
