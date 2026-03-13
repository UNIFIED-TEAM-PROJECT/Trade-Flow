# TradesFlow MVP

Production-minded MVP for a multi-tenant field service operating system serving trades businesses.

## Product Scope

TradesFlow includes:
- Multi-tenant contractor platform
- Role-based auth (platform admin, owner, manager, technician, customer)
- Dispatch Centre with incoming request triage and assignment flow
- Job lifecycle management (request -> estimate -> schedule -> complete -> invoice)
- Fleet + van tracking (OpenStreetMap + Leaflet)
- Depot + van inventory with rack/slot structure
- Stock movement logging (job issue, restock, transfer, return, damaged/lost, audit)
- Van readiness scoring for dispatch
- Estimates + invoices + payment status flow
- Subscription/protection plans with SLA states
- Customer/company/technician in-app chat
- Accounting + VAT summaries and export stub
- Marketplace catalogue + markup engine
- Property asset register and asset lifecycle actions
- PWA-ready frontend + Capacitor Android scaffolding for APK builds

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn-style component architecture
- TanStack Query
- Prisma ORM
- PostgreSQL
- JWT auth with role + org context enforcement
- OpenStreetMap + Leaflet
- Capacitor (Android project scaffolding included)

## Repository Structure

```text
.
|-- src/
|   |-- app/
|   |   |-- (portal)/app/...             # Owner/manager/dispatcher app
|   |   |-- (technician)/technician/...  # Technician mobile workspace
|   |   |-- (customer)/customer/...      # Customer portal/app
|   |   `-- api/...                      # API routes
|   |-- components/
|   |   |-- layout/
|   |   |-- modules/                     # Dispatch, inventory, marketplace, assets, maps
|   |   `-- ui/
|   `-- lib/                             # Auth, RBAC, ops/readiness, analytics, db
|-- prisma/
|   |-- schema.prisma
|   |-- seed.ts
|   `-- migrations/
|-- android/                             # Capacitor Android project
|-- public/
|-- scripts/start.sh                     # Safe production start script
|-- Dockerfile
|-- docker-compose.yml
`-- render.yaml
```

## Local Setup

### Option A: Docker (fastest)

```bash
docker compose up --build
```

Services:
- App: `http://localhost:3000`
- Postgres: `localhost:5432`

`docker-compose.yml` sets `RUN_DB_SEED=true`, so demo data is seeded automatically for local demo runs.

### Option B: Native Node + Postgres

1. Install dependencies
```bash
npm ci
```

2. Copy env and update values
```bash
cp .env.example .env
```

3. Apply migrations and seed
```bash
npx prisma migrate dev --name init
npm run db:seed
```

4. Run app
```bash
npm run dev
```

5. Production build check
```bash
npm run build
npm run start
```

## Environment Variables

Use `.env.example` as baseline.

Required:
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`

Optional:
- `CAP_SERVER_URL` (Capacitor dev webview URL)
- `RUN_DB_SEED` (`true|false`, respected by `scripts/start.sh`)

## Demo Accounts

Shared password for seeded demo users: `password123`

Primary org (`Carlisle Plumbing & Heating Ltd`):
- `owner@demo.tradesflow`
- `manager@demo.tradesflow`
- `tech1@demo.tradesflow`
- `tech2@demo.tradesflow`
- `tech3@demo.tradesflow`
- `customer1@demo.tradesflow`

Platform admin:
- `admin@tradesflow.co.uk`

Secondary org (`West Coast Trade Services Ltd`):
- `owner@westcoast.demo`
- `manager@westcoast.demo`
- `tech@westcoast.demo`
- `customer@westcoast.demo`

## Seed Coverage

Seed data includes:
- 2 organisations (multi-tenancy validation)
- 20+ customers
- 25+ properties
- 25 jobs across lifecycle states
- 10+ incoming requests including emergencies
- 10 estimates + 10 invoices
- 5+ active subscriptions + cancelled/lapsed examples
- 3 vans + depots + route/location history
- 30+ inventory lines across depot and vans
- stock movements for all core movement types
- marketplace categories/products/supplier sources
- installed property assets + lifecycle history
- chat threads/messages
- accounting, receipts, ledger entries, VAT periods
- analytics snapshots

## Key Workflow Modules

### Dispatch Centre
- Incoming queue
- Emergency queue
- SLA risk queue
- Ready-to-schedule queue
- Technician availability
- Van readiness and stock fit
- Assignment wizard

### Inventory Logistics
- Depot inventory + van inventory
- Rack/slot layout
- Movement logging endpoints
- Job-linked deductions
- Depot-to-van and van-to-van transfer support

### Marketplace + Assets
- Contractor product catalogue with markup calculations
- Planned works product selection on requests
- Installed-product-to-property-asset conversion
- Asset warranty and replacement tracking

## API Areas

Representative route groups:
- `/api/auth/*`
- `/api/customer/*`
- `/api/ops/dispatch/*`
- `/api/ops/incoming-jobs`
- `/api/ops/jobs/[id]/review`
- `/api/ops/jobs/[id]/assign`
- `/api/ops/inventory/*`
- `/api/ops/marketplace/catalog`
- `/api/ops/assets/overview`
- `/api/resources/[resource]` (RBAC-enforced CRUD surface)

## Render Deployment

`render.yaml` is included and ready.

### Recommended deploy flow (branch-safe)

1. Push this branch (not `main`) to GitHub.
2. In Render service settings, set deploy branch to this branch.
3. Ensure env vars are configured:
   - `DATABASE_URL` (from Render Postgres)
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL`
   - `RUN_DB_SEED` (`true` for first deploy only, then set to `false`)
4. Deploy.

Start command used:
```bash
sh scripts/start.sh
```

This script:
- runs `prisma migrate deploy`
- runs seed only if `RUN_DB_SEED=true`
- starts Next.js

### Render one-time seeding note

To avoid resetting data on every restart:
- first deployment: set `RUN_DB_SEED=true`
- after successful seed + login check: set `RUN_DB_SEED=false` and redeploy

## Ubuntu VPS Deployment (Docker)

1. Install Docker + Compose plugin
2. Copy repo to server
3. Create `.env` with production values
4. Start:
```bash
docker compose up -d --build
```
5. Put Nginx/Caddy in front of `:3000`
6. Configure HTTPS (Let's Encrypt)

## APK Build (Capacitor)

Prerequisites:
- Android Studio + SDK
- Java 17+

Steps:

```bash
npm ci
npm run build
npx cap sync android
npx cap open android
```

In Android Studio:
- Build > Build Bundle(s)/APK(s) > Build APK(s)

For local webview development:
- set `CAP_SERVER_URL` in `.env`
- run `npm run dev:mobile`

## Architecture Summary

- Next.js monolith with modular domain APIs
- Prisma model layer supports strict org isolation
- Role + membership checks enforced in API + resource routes
- Operations logic separated in `src/lib/ops.ts` for readiness scoring and dispatch helpers
- Seed script creates realistic Cumbria operational data for investor/demo narrative

## Assumptions

- MVP uses deterministic internal AI triage and no external LLM provider
- Payment processing is mock/invoice-state based (no live gateway)
- Scanner workflow supports code entry + placeholders; hardware scanning can be integrated later
- Map routing uses seeded route points and periodic position updates
