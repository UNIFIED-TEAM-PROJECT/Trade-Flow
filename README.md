# TradesFlow MVP

Production-minded MVP of **TradesFlow**: a multi-tenant field service operating system for contractor businesses.

This repository includes:
- Next.js 14 App Router web app (admin/manager dashboard, technician workspace, customer portal)
- TypeScript backend APIs in Next route handlers
- PostgreSQL + Prisma schema/migrations + seed data
- JWT auth with role-based access control and tenancy scoping
- Inventory racks/slots/items with scan-to-deduct flow
- Jobs, estimates, invoices, subscriptions, chat, accounting/VAT, analytics, AI triage stub
- Local file upload abstraction
- Docker + docker-compose for test server deployment
- Capacitor config + Android build path for APK packaging

## 1. Tech Stack
- Frontend: Next.js 14, TypeScript, Tailwind CSS, React Query, Zustand
- Backend: Next.js API routes, Prisma ORM
- Database: PostgreSQL
- Auth: JWT cookie auth (role + organisation context)
- Mobile: responsive UI + Capacitor integration

## 2. Roles
- Platform Super Admin
- Contractor Company Owner
- Company Manager / Dispatcher
- Technician / Engineer
- Customer / Homeowner / Landlord

Role checks are enforced in API routes and route-level UI access.

## 3. Multi-Tenant Isolation
Most domain tables are tenant scoped via `organisationId`.  
API resource handlers automatically enforce tenant filters for non-super-admin users.

## 4. Feature Modules Included
- Auth + signup + password reset + invite acceptance
- Organisation profile + contractor white-label branding
- Jobs lifecycle with status history
- Customer/property records
- Fleet (vans) + racks + slots
- Inventory + stock movements + code-based deduction
- Estimates + approvals
- Invoices + mock payment updates
- Subscription plans + customer subscriptions
- Chat threads + messages
- Accounting + ledger + VAT periods + HMRC export stub
- Analytics overview + trend charts
- AI assistant deterministic triage service
- Attachments/file upload route

## 5. Repository Structure
```text
prisma/
  schema.prisma
  seed.ts
  migrations/
src/
  app/
    (portal)/app/...         # owner/manager/dispatcher portal
    (technician)/technician/...  # technician mobile workspace
    (customer)/customer/...      # customer portal
    api/...                   # all backend APIs
  components/
  lib/
Dockerfile
docker-compose.yml
capacitor.config.ts
.env.example
scripts/deploy-ubuntu.sh
```

## 6. Local Run (without Docker)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env:
   ```bash
   cp .env.example .env
   ```
3. Start PostgreSQL (local) and ensure `DATABASE_URL` is correct.
4. Run migrations + seed:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
5. Start app:
   ```bash
   npm run dev
   ```
6. Open:
   - App: `http://localhost:3000`
   - Health check: `http://localhost:3000/api/health`

## 7. Docker Deployment (quick test server)
```bash
docker compose up --build
```

This starts:
- `tradesflow-db` (PostgreSQL)
- `tradesflow-app` (Next.js app)

The app container runs:
- `prisma migrate deploy`
- `npm run db:seed`
- `npm start`

## 8. Demo Accounts (Seeded)
Password for seeded users: `password123`

- `owner@demo.tradesflow`
- `manager@demo.tradesflow`
- `tech1@demo.tradesflow`
- `tech2@demo.tradesflow`
- `tech3@demo.tradesflow`
- `customer1@demo.tradesflow`
- `admin@tradesflow.co.uk` (platform super admin)

## 9. Seeded Demo Data
- 2 organisations (tenant separation)
- 1 owner + 1 manager + 3 technicians
- 3 vans + full rack/slot layout
- 30+ inventory items
- 20+ customers and properties
- 20+ jobs across statuses
- 10+ estimates
- 10+ invoices
- 5+ active subscriptions
- 10+ expenses/receipts
- 10+ chat threads/messages
- analytics snapshots, VAT periods, ledger entries, AI interactions

## 10. API Highlights
- Auth: `/api/auth/*`
- Generic tenant CRUD: `/api/resources/[resource]`
- Jobs status: `/api/jobs/[id]/status`
- Inventory usage: `/api/inventory/use`
- Estimate decision: `/api/estimates/[id]/respond`
- Invoice payment: `/api/invoices/[id]/mark-paid`
- Chat messages: `/api/chat/threads/[threadId]/messages`
- Dashboard: `/api/dashboard/overview`
- Analytics: `/api/analytics/overview`
- Accounting: `/api/accounting/overview`, `/api/accounting/vat-export`
- AI triage: `/api/ai/triage`
- File upload: `/api/files/upload`

## 11. APK / Mobile Build Path (Capacitor)
This MVP is set up for Capacitor webview packaging.

1. Ensure app is reachable (dev or deployed URL), e.g. `http://10.0.2.2:3000` for Android emulator.
2. Set `CAP_SERVER_URL` in `.env`.
3. Initialize and sync:
   ```bash
   npm run cap:init
   npx cap add android
   npm run cap:sync
   ```
4. Open Android project:
   ```bash
   npx cap open android
   ```
5. Build APK from Android Studio (`Build > Build Bundle(s) / APK(s)`).

## 12. Ubuntu VPS Notes
- Helper script: `scripts/deploy-ubuntu.sh`
- Add Nginx reverse proxy to `127.0.0.1:3000`
- Enable TLS using Certbot:
  - `sudo certbot --nginx -d tradesflow.co.uk`

## 13. Architecture Summary
- **App router + role portals**: owner/manager, technician, and customer workflows each get dedicated UX routes.
- **Auth model**: JWT cookie stores user + selected org + role; APIs validate membership on every write.
- **Domain model**: Prisma schema includes all major entities for jobs, fleet, inventory, finance, subscriptions, chat, analytics, AI logs, and audit.
- **Scalability**: service abstractions (`lib/ai`, `lib/analytics`, `lib/accounting`, `lib/storage`) isolate provider integrations for future upgrades.

## 14. Assumptions
- Mock payment and HMRC submission are intentionally internal stubs for MVP.
- QR scanning currently supports manual code entry + generated QR labels; camera-native scanning is prepared for future integration.
- Map/routing is placeholder logic using stored coordinates and proximity rules (no paid API dependency).
