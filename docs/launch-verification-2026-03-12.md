# TradesFlow Launch Verification (2026-03-12)

## Environment
- Branch: `codex/trades-flow`
- Base URL used for checks: `http://localhost:4015`
- Database: local PostgreSQL service (`postgresql-x64-17`)
- Prisma migration: `0001_init` applied
- Seed: successful (`npm run db:seed`)

## Runtime Notes
- `docker` command was not available on this machine, so deployment smoke checks were executed using local PostgreSQL + local Next.js runtime.
- Local DB bootstrap command used:
  - `npx prisma db execute --url "postgresql://postgres:postgres@localhost:5432/postgres?schema=public" --file scripts/init-local-db.sql`

## Build Validation
- `npm run lint` passed (only `next/image` advisories for SVG brand assets)
- `npm run build` passed
- `npx cap add android` passed
- `npx cap sync android` passed

## Role End-to-End Checks
All checks were executed against live APIs with authenticated sessions.

### Owner (`owner@demo.tradesflow`)
- `POST /api/auth/login` -> `200`
- `GET /api/auth/me` -> role `OWNER`
- `GET /api/dashboard/overview` -> `200`
- `POST /api/organisation/invites` -> `200`

### Manager (`manager@demo.tradesflow`)
- `POST /api/auth/login` -> `200`
- `GET /api/accounting/overview` -> `200`
- `GET /api/analytics/overview` -> `200`

### Technician (`tech1@demo.tradesflow`)
- `POST /api/auth/login` -> `200`
- `GET /api/resources/jobs` -> `200`
- `GET /api/accounting/overview` -> `403` (correctly blocked)
- `POST /api/jobs/{id}/status` -> `200`
- `POST /api/inventory/use` -> `200`

### Customer (`customer1@demo.tradesflow`)
- `POST /api/auth/login` -> `200`
- `GET /api/customer/jobs` -> `200`
- `POST /api/customer/jobs` -> `201`
- `POST /api/ai/triage` -> `200`
- `POST /api/estimates/{id}/respond` -> `200`
- `GET /api/accounting/overview` -> `403` (correctly blocked)

## Portal Route Checks
- `GET /app/dashboard` -> `200`
- `GET /technician` -> `200`
- `GET /customer` -> `200`
