# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

### Root (runs all workspaces in parallel via Turborepo)
```bash
npm run dev          # Start both API and web in development mode
npm run build        # Build all packages
npm run lint         # Lint all workspaces
npm run typecheck    # Type-check all workspaces
npm run format       # Prettier format all files
npm run test         # Run all tests
```

### API (`apps/api`)
```bash
npm run dev          # Start with nodemon + tsx hot reload
npm run build        # Bundle with esbuild to dist/server.js
npm run test         # Run Vitest
npm run test:coverage
npm run typecheck

# Database
npm run db:push      # Apply schema changes directly (dev)
npm run db:generate  # Generate migration files
npm run seed         # Seed initial data
```

### Web (`apps/web`)
```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

## Architecture

### Monorepo Structure
Turborepo monorepo with two apps and three shared packages:
- `apps/api` — Express v5 backend (Node.js, TypeScript, ESM)
- `apps/web` — Vue 3 frontend (Vite, Composition API)
- `packages/validators` — Zod schemas shared between API and web
- `packages/types` — TypeScript types shared between API and web
- `packages/config` — Shared tsconfig, prettier, and eslint config

The `.env` file lives at the **workspace root** and is loaded by both apps. Vite loads it via `envDir: '../../'` in `apps/web/vite.config.js`.

### API Architecture (`apps/api`)

**Module pattern** — each feature module under `src/modules/{name}/` contains:
- `{name}.routes.ts` — Express router, applies auth/validation middleware
- `{name}.controller.ts` — Request handlers (thin, delegates to repository)
- `{name}.repository.ts` — All database access via Drizzle ORM
- Optionally: `{name}.pdf.ts` for PDF generation, `{name}.middleware.ts`

**Shared infrastructure** in `src/shared/`:
- `middlewares/validate.ts` — Zod schema validation middleware (wraps `@procurement/validators`)
- `middlewares/role-auth.ts` — Role-based authorization
- `utils/response.ts` — Standard API response shape
- `utils/asyncHandler.ts` — Wraps async route handlers to forward errors
- `utils/auditLog.ts` / `utils/notificationService.ts` — Cross-cutting concerns

**Database** uses Drizzle ORM with MySQL/MariaDB (`mysql2` driver). Schema is defined in `src/db/schema/index.ts` and configured via env vars `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`.

TypeScript path aliases configured in `tsconfig.json`: `#shared/*` → `src/shared/*`, `#modules/*` → `src/modules/*`, `#config/*` → `src/config/*`.

**Key enums to know** (used throughout DB schema and validation):
- `UserType`: Admin, Staff, Manager, Crew
- `RequestStatus`: `Approved by system`, Waiting, Approved, Rejected
- `POStatus`: `Auto Approved`, `Pending Approval`, Approved, Rejected

### Web Architecture (`apps/web`)

**Feature-based structure** — each feature under `src/features/{name}/` contains:
- `routes.js` — Vue Router route definitions (lazy-loaded views)
- `store.js` — Pinia store (state + actions)
- `api.js` — Axios wrapper functions for this feature's endpoints
- `views/` — Page-level Vue components
- `component/` — Feature-specific components (optional)

**Centralized HTTP** via `src/services/http.js` — all API calls go through an axios instance that injects auth tokens and handles errors uniformly. Import this in `api.js` files, not raw axios.

**Component libraries**: PrimeVue v4 for UI components, Tailwind CSS v4 for styling, lucide-vue-next for icons.

**Notifications** use SweetAlert2 (`src/services/notification.js`) for toasts/dialogs. Real-time notifications use SSE managed by the notification Pinia store.

### Procurement Workflow
The main business flow: Vessel Request → MOC (Material of Change) → Purchase Order → Good Receipt. Each step has its own module on both API and web sides.

### Shared Validators
`@procurement/validators` Zod schemas are used in two places:
1. **API** — passed to the `validate` middleware in route definitions
2. **Web** — used directly in Vue form components for client-side validation

When adding a new field or entity, update the relevant schema in `packages/validators/src/` first, then update both API and web usage.
