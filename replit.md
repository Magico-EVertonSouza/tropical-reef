# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Tropical Reef (artifacts/tropical-reef)

React + Vite + Firebase (Firestore + Auth) coral e-commerce PWA.

### Architecture
- `src/types/coral.ts` — Coral, CoralFormData, User types (includes `stock: number`)
- `src/lib/firebase.ts` — Firebase init (long-polling mode for Replit)
- `src/lib/firestore.ts` — Firestore CRUD + `subscribeCorals()` (onSnapshot real-time)
- `src/lib/seed.ts` — Demo seed data with stock values
- `src/context/AuthContext.tsx` — Firebase Auth state
- `src/context/CartContext.tsx` — Cart with quantity, localStorage persistence, WhatsApp checkout
- `src/pages/Catalog.tsx` — Real-time catalog (onSnapshot), floating cart with total
- `src/pages/Admin.tsx` — Admin dashboard with stock column
- `src/components/CoralCard.tsx` — Card with stock display, +/- quantity controls
- `src/components/CoralDialog.tsx` — Create/Edit form with Status + Quantidade fields

### Key Features
- Real-time inventory via Firestore onSnapshot
- Stock/quantity system (per coral)
- Cart with per-item quantity, stock validation, localStorage persistence
- WhatsApp checkout with itemized list and total
- Status badges: green (available), yellow (reserved), red (sold/esgotado)
- Admin: status select field (fixed), stock field, stock column in table
