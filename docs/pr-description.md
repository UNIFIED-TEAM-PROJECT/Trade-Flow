## TradesFlow MVP Delivery

This PR ships a production-minded MVP of TradesFlow as a multi-tenant field service SaaS platform with role-based portals, full backend APIs, seeded demo data, and deployment/mobile paths.

### What is included
- Next.js 14 + TypeScript + Tailwind full application
- JWT auth with role + tenant enforcement
- Prisma/PostgreSQL schema with full domain models
- Seeded demo organisation data for owner/manager/tech/customer workflows
- Core modules:
  - onboarding/auth
  - dashboard
  - customers/properties
  - jobs lifecycle
  - fleet + van inventory racks/slots
  - estimates + invoices + mock payments
  - subscriptions/protection plans
  - chat
  - accounting + VAT + HMRC export stub
  - analytics dashboards
  - AI assistant deterministic triage
  - local file upload abstraction
- Deployment stack:
  - Dockerfile
  - docker-compose
  - `.env.example`
  - migrations + seed
  - Ubuntu deployment helper script
- Mobile path:
  - responsive technician/customer UX
  - Capacitor Android project scaffolding

### Verification performed
- `npm run lint` (pass, non-blocking image advisories only)
- `npm run build` (pass)
- `npx cap add android` (pass)
- `npx cap sync android` (pass)
- Live role-flow checks on running app (owner/manager/tech/customer), including RBAC negative checks

Detailed evidence: `docs/launch-verification-2026-03-12.md`

### Notes
- Docker runtime could not be executed locally because Docker CLI is not installed on this machine; equivalent live verification was executed using local PostgreSQL + local Next.js runtime.
- Local DB bootstrap helper added: `scripts/init-local-db.sql`.
