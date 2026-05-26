# Turborepo Migration Plan - Procurement Vessel Management System

**Project:** Procurement Vessel Management System  
**Migration Date:** February 27, 2026  
**Status:** Planning Phase → Implementation  
**Strategy:** Phased approach with minimal disruption

---

## Executive Summary

This document outlines the complete migration strategy from a traditional client-server separation to a Turborepo monorepo architecture. The migration is designed in three phases to minimize disruption while modernizing the codebase with ESM modules and shared packages.

### Key Objectives

- ✅ Consolidate backend and frontend into unified monorepo
- ✅ Standardize on Node.js 20 LTS across all packages
- ✅ Migrate backend from CommonJS to ESM for consistency
- ✅ Create shared packages for types, validation, and configuration
- ✅ Improve development experience with Turborepo caching
- ✅ Maintain backward compatibility with existing deployment (PM2)

### Technology Decisions

| Aspect              | Current State                    | Target State                       | Rationale                                                    |
| ------------------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------------ |
| **Repository**      | Separate `be/` and `fe/` folders | Turborepo monorepo                 | Better code sharing, unified tooling, improved caching       |
| **Node Version**    | BE: v18+, FE: v20.19+            | Unified v20.19.0 LTS               | Long-term support, modern features, frontend requirement     |
| **Module System**   | BE: CommonJS, FE: ESM            | Unified ESM                        | Better tree-shaking, native Node.js support, modern standard |
| **Code Sharing**    | None (implicit API contract)     | Shared packages (`@procurement/*`) | Type safety, DRY principle, single source of truth           |
| **Package Manager** | npm (separate)                   | npm workspaces + Turborepo         | Workspace linking, faster installs, build caching            |
| **Deployment**      | PM2 from `be/`                   | PM2 from `apps/api/`               | Preserve existing deployment workflow                        |

---

## Current Architecture Analysis

### Project Structure (Before Migration)

```
Procurement/
├── be/                          # Backend application (Node.js/Express)
│   ├── src/
│   │   ├── modules/             # Feature modules (auth, vessel-request, master-data)
│   │   ├── config/              # Configuration (database, logger, drizzle)
│   │   ├── shared/              # Shared utilities and middleware
│   │   └── routes/              # Route aggregation
│   ├── drizzle/                  # Database schema and migrations
│   ├── logs/                    # PM2 and application logs
│   ├── package.json
│   ├── ecosystem.config.js      # PM2 configuration
│   └── .env
│
└── fe/                          # Frontend application (Vue.js/Vite)
    ├── src/
    │   ├── features/            # Feature modules (auth, vessel, request, master-data)
    │   ├── components/          # Shared components
    │   ├── services/            # HTTP, token, notification services
    │   └── app/                 # App bootstrap (main.js, router.js)
    ├── public/
    ├── package.json
    ├── vite.config.js
    └── .env
```

### Technology Stack Inventory

#### Backend (`be/`)

- **Runtime:** Node.js v18+
- **Framework:** Express v5.2.1
- **Language:** JavaScript (CommonJS)
- **Database:** MySQL/MariaDB via Drizzle v7.3.0 + mysql2 v3.16.2
- **Validation:** Zod v4.3.6
- **Logging:** Pino v10.3.0 (structured logging)
- **Security:** bcrypt v6.0.0 (password hashing)
- **Process Manager:** PM2 v5.4.3 (cluster mode, auto-restart, 500MB memory limit)
- **Module Aliases:** `module-alias` package (`@shared`, `@modules`, `@config`)
- **Dev Tools:** nodemon v3.1.11

**Key Dependencies:**

```json
{
  "express": "^5.2.1",
  "@drizzle/adapter-mariadb": "^7.3.0",
  "@drizzle/client": "^7.3.0",
  "mysql2": "^3.16.2",
  "zod": "^4.3.6",
  "pino": "^10.3.0",
  "pino-http": "^10.5.0",
  "bcrypt": "^6.0.0",
  "pm2": "^5.4.3",
  "module-alias": "^2.2.3"
}
```

#### Frontend (`fe/`)

- **Runtime:** Node.js v20.19.0 or v22.12.0+ (enforced)
- **Framework:** Vue.js v3.5.26 (Composition API)
- **Build Tool:** Vite v7.3.1
- **Language:** JavaScript (ESM)
- **Styling:** Tailwind CSS v4.1.18 with `@tailwindcss/vite` v4.1.18
- **UI Library:** PrimeVue v4.5.4 with `@primeuix/themes` v2.0.3
- **Icons:** lucide-vue-next v0.563.0
- **State Management:** Pinia v3.0.4
- **Routing:** Vue Router v4.6.4
- **HTTP Client:** axios v1.13.4 (with interceptors)
- **Notifications:** sweetalert2 v11.26.18
- **Code Formatting:** Prettier v3.8.1

**Key Dependencies:**

```json
{
  "vue": "^3.5.26",
  "vite": "^7.3.1",
  "@tailwindcss/vite": "^4.1.18",
  "tailwindcss": "^4.1.18",
  "primevue": "^4.5.4",
  "@primeuix/themes": "^2.0.3",
  "vue-router": "^4.6.4",
  "pinia": "^3.0.4",
  "axios": "^1.13.4",
  "sweetalert2": "^11.26.18"
}
```

### Architecture Patterns

#### Backend: Feature-Based / Domain-Driven Design

Each feature module is self-contained:

```
modules/{feature}/
├── {feature}.controller.js     # HTTP request handlers
├── {feature}.repository.js     # Database operations (Drizzle + raw MySQL)
├── {feature}.routes.js         # Express route definitions
├── {feature}.validation.js     # Zod validation schemas
└── {feature}.middleware.js     # Optional feature-specific middleware
```

**Design Principles:**

- **Repository Pattern:** Database logic isolated in repository layer
- **Controller Pattern:** Business logic in controllers
- **Validation Middleware:** Zod schemas validate requests before controller execution
- **Error Handling:** Custom `AppError` class with `asyncHandler` wrapper
- **Response Format:** Standardized success/error JSON responses

#### Frontend: Feature-Based with Lazy Loading

Each feature module contains:

```
features/{feature}/
├── api.js              # Feature-specific API calls
├── routes.js           # Vue Router routes (lazy-loaded)
├── store.js            # Pinia state management
├── views/              # Page components
└── component/          # Feature-specific components
```

**Design Principles:**

- **Lazy Loading:** Routes use `() => import('./views/...')`
- **State Management:** Feature-specific Pinia stores
- **Service Layer:** Shared HTTP client with token injection
- **Component Library:** PrimeVue components with Tailwind styling

### Communication & API Contract

**API Base URL:** `http://localhost:3000/api`

**Authentication Flow:**

1. Frontend requests API token: `POST /api/token` with device ID
2. Token stored in `localStorage` under key from `VITE_TOKEN_SECRET`
3. Axios interceptor injects token into header: `Authorization: Bearer {token}`
4. Backend validates token via middleware
5. Login associates token with user ID: `POST /api/auth/login`

**Response Format:**

```javascript
// Success
{ success: true, data: {...}, message: "Success message" }

// Error
{ success: false, error: "Error message", errors: [...] }
```

### Critical Issues Identified

#### 1. Module System Divergence ⚠️

- **Backend:** CommonJS (`require`, `module.exports`)
- **Frontend:** ESM (`import`, `export`)
- **Impact:** Mixed module systems complicate tooling and build optimization
- **Solution:** Migrate backend to ESM in Phase 2

#### 2. Node Version Mismatch ⚠️

- **Backend:** Requires Node v18+
- **Frontend:** Enforces Node v20.19+ or v22.12+
- **Impact:** Developers need to switch Node versions between projects
- **Solution:** Standardize on Node v20.19.0 LTS

#### 3. No Shared Code ⚠️

- API contract is implicit (no shared types)
- Validation schemas duplicated (if used in FE)
- Constants and enums duplicated
- **Impact:** Type safety issues, potential drift between FE and BE expectations
- **Solution:** Create shared packages in Phase 3

#### 4. Database Migrations Not Version Controlled ⚠️

- `be/drizzle/migrations/` is in `.gitignore`
- **Impact:** Migration history lost, deployment issues
- **Solution:** Remove from `.gitignore`, commit migration history

#### 5. No Testing Infrastructure ⚠️

- No test files, frameworks, or configuration
- **Impact:** No automated quality assurance
- **Solution:** Add in future phase (post-migration)

#### 6. Inconsistent Code Formatting ⚠️

- **Backend:** Tabs (width: 4), semicolons: yes
- **Frontend:** Spaces (width: 2), semicolons: no, single quotes
- **Impact:** Inconsistent codebase, merge conflicts
- **Solution:** Unified Prettier config in Phase 1

---

## Target Architecture

### Project Structure (After Migration)

```
Procurement/                     # Monorepo root
├── apps/
│   ├── api/                     # Backend application (formerly be/)
│   │   ├── src/
│   │   │   ├── modules/         # Feature modules
│   │   │   ├── config/          # Configuration
│   │   │   ├── shared/          # Shared utilities
│   │   │   └── routes/
│   │   ├── drizzle/              # Database schema
│   │   ├── logs/
│   │   ├── package.json         # Name: @procurement/api
│   │   ├── ecosystem.config.js
│   │   └── .env
│   │
│   └── web/                     # Frontend application (formerly fe/)
│       ├── src/
│       │   ├── features/
│       │   ├── components/
│       │   ├── services/
│       │   └── app/
│       ├── public/
│       ├── package.json         # Name: @procurement/web
│       ├── vite.config.js
│       └── .env
│
├── packages/                    # Shared packages
│   ├── types/                   # TypeScript type definitions
│   │   ├── src/
│   │   │   ├── user.ts
│   │   │   ├── vessel.ts
│   │   │   ├── request.ts
│   │   │   ├── item.ts
│   │   │   ├── vendor.ts
│   │   │   ├── api.ts           # API request/response types
│   │   │   └── index.ts
│   │   ├── package.json         # Name: @procurement/types
│   │   └── tsconfig.json
│   │
│   ├── validators/              # Zod validation schemas
│   │   ├── src/
│   │   │   ├── auth.ts
│   │   │   ├── vessel.ts
│   │   │   ├── request.ts
│   │   │   └── index.ts
│   │   ├── package.json         # Name: @procurement/validators
│   │   └── tsconfig.json
│   │
│   └── config/                  # Shared configuration constants
│       ├── src/
│       │   ├── routes.ts        # API route definitions
│       │   ├── constants.ts     # Shared constants
│       │   ├── enums.ts         # Shared enums
│       │   └── index.ts
│       ├── package.json         # Name: @procurement/config
│       └── tsconfig.json
│
├── docs/                        # Documentation
│   ├── IMPLEMENTATION-GUIDE.md
│   ├── API-REFERENCE.md
│   └── DEVELOPMENT.md
│
├── package.json                 # Root package.json (workspaces)
├── turbo.json                   # Turborepo configuration
├── .nvmrc                       # Node version (20.19.0)
├── .prettierrc                  # Unified Prettier config
├── .gitignore                   # Unified git ignore
└── README.md                    # Project overview
```

### Workspace Dependencies

```
Root
├── apps/api (depends on packages/types, packages/validators, packages/config)
├── apps/web (depends on packages/types, packages/config)
└── packages/
    ├── types (no internal dependencies)
    ├── validators (depends on packages/types)
    └── config (no internal dependencies)
```

**Turborepo Build Order:**

1. `packages/types`, `packages/config` (parallel)
2. `packages/validators` (depends on types)
3. `apps/api`, `apps/web` (parallel, after packages)

---

## Phase 1: Turborepo Foundation (Minimal Disruption)

**Goal:** Set up Turborepo monorepo with existing code unchanged. Everything must continue working with improved caching and unified tooling.

**Duration Estimate:** 2-4 hours  
**Risk Level:** 🟢 Low (no code changes, only restructuring)

### Step 1.1: Initialize Turborepo at Root

**Actions:**

1. Create root `package.json`:

```json
{
  "name": "procurement-monorepo",
  "version": "1.0.0",
  "private": true,
  "description": "Procurement Vessel Management System - Turborepo Monorepo",
  "workspaces": ["apps/*", "packages/*"],
  "engines": {
    "node": ">=20.19.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "clean": "turbo clean && rm -rf node_modules",
    "test": "turbo test"
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "prettier": "^3.8.1"
  }
}
```

2. Install Turborepo:

```bash
cd d:/personal-project/Procurement
npm install
```

3. Create `.nvmrc`:

```
20.19.0
```

4. Create root `.gitignore` (merge BE + FE patterns):

```gitignore
# Dependencies
node_modules/
.pnp.*

# Build outputs
dist/
build/
.turbo/
.next/
out/

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# PM2
.pm2/

# Drizzle
drizzle/migrations/ # REMOVE THIS - migrations should be version controlled
```

**Note:** After Phase 1, remove `drizzle/migrations/` from `.gitignore` and commit existing migrations.

### Step 1.2: Create Turborepo Configuration

**File:** `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env", "tsconfig.json"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"],
      "env": [
        "NODE_ENV",
        "DATABASE_URL",
        "JWT_SECRET",
        "API_TOKEN_SECRET",
        "VITE_API_BASE_URL",
        "VITE_TOKEN_SECRET"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true,
      "env": [
        "NODE_ENV",
        "PORT",
        "HOST",
        "DATABASE_URL",
        "JWT_SECRET",
        "API_TOKEN_SECRET",
        "VITE_API_BASE_URL",
        "VITE_TOKEN_SECRET"
      ]
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "format": {
      "outputs": [],
      "cache": false
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

**Key Configuration:**

- `dependsOn: ["^build"]` - Build dependencies first
- `persistent: true` for `dev` - Keep dev servers running
- `cache: false` for `dev` - Don't cache dev server output
- Environment variables listed for cache invalidation

### Step 1.3: Restructure Directories

**Actions:**

1. **Create apps directory:**

```bash
mkdir apps
```

2. **Move backend to apps/api:**

```bash
mv be apps/api
```

3. **Move frontend to apps/web:**

```bash
mv fe apps/web
```

4. **Verify structure:**

```
Procurement/
├── apps/
│   ├── api/
│   └── web/
└── package.json
```

### Step 1.4: Update Backend Package Configuration

**File:** `apps/api/package.json`

**Changes:**

1. Add `"name": "@procurement/api"`
2. Update Node engine: `"node": ">=20.19.0"`
3. Keep existing scripts (Turbo will call them)

**Updated fields:**

```json
{
  "name": "@procurement/api",
  "version": "1.0.0",
  "description": "Procurement Vessel Management API",
  "private": true,
  "main": "src/server.js",
  "engines": {
    "node": ">=20.19.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "pm2:start": "pm2 start ecosystem.config.js --env production",
    "pm2:start:dev": "pm2 start ecosystem.config.js --env development",
    "pm2:stop": "pm2 stop ecosystem.config.js",
    "pm2:restart": "pm2 restart ecosystem.config.js",
    "pm2:reload": "pm2 reload ecosystem.config.js",
    "pm2:delete": "pm2 delete ecosystem.config.js",
    "pm2:logs": "pm2 logs",
    "pm2:monit": "pm2 monit",
    "pm2:status": "pm2 status"
  },
  "_moduleAliases": {
    "@shared": "src/shared",
    "@modules": "src/modules",
    "@config": "src/config",
    "@routes": "src/routes"
  }
}
```

**Note:** `_moduleAliases` will be removed in Phase 2 (ESM migration).

### Step 1.5: Update Frontend Package Configuration

**File:** `apps/web/package.json`

**Changes:**

1. Add `"name": "@procurement/web"`
2. Keep existing scripts and engines

**Updated fields:**

```json
{
  "name": "@procurement/web",
  "version": "1.0.0",
  "description": "Procurement Vessel Management Web Interface",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20.19.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "format": "prettier --write --experimental-cli src/"
  }
}
```

### Step 1.6: Create Unified Prettier Configuration

**File:** `.prettierrc` (root)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 100,
  "trailingComma": "es5",
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Rationale:**

- `semi: true` - Explicit statement termination
- `singleQuote: true` - Consistent string literals
- `tabWidth: 2, useTabs: false` - Modern JavaScript standard
- `printWidth: 100` - Balance readability and line length
- `trailingComma: "es5"` - Cleaner diffs
- `arrowParens: "always"` - Explicit arrow function params
- `endOfLine: "lf"` - Unix-style line endings

**Note:** Run `npm run format` after Phase 1 to reformat all code.

### Step 1.7: Install Dependencies

**Commands:**

```bash
# From root directory
cd d:/personal-project/Procurement
npm install

# This will:
# 1. Install root dependencies (turbo, prettier)
# 2. Install all workspace dependencies (apps/api, apps/web)
# 3. Link workspace packages (when created in Phase 3)
```

### Step 1.8: Test Phase 1 Completion

**Verification Checklist:**

1. **Install successful:**

```bash
npm install
# Should complete without errors
# Check node_modules exists in root, apps/api, apps/web
```

2. **Turbo dev works:**

```bash
npm run dev
# Should start both API (port 3000) and Web (port 5173)
# Watch for:
# - API: "Server is running on http://localhost:3000"
# - Web: "Local: http://localhost:5173/"
```

3. **API accessible:**

```bash
# Test API health endpoint
curl http://localhost:3000/api/token
# Should return JSON (even if error, proves server running)
```

4. **Web accessible:**

- Open browser: `http://localhost:5173`
- Should see login page
- Check browser console for errors

5. **Login flow:**

- Enter credentials in web app
- Test login functionality
- Verify API token generation and authentication

6. **PM2 still works:**

```bash
cd apps/api
npm run pm2:start:dev
npm run pm2:status
# Should show API running
npm run pm2:delete
```

7. **Build pipeline:**

```bash
npm run build
# API: Should complete (no build step currently)
# Web: Should build to apps/web/dist
```

8. **Turbo caching:**

```bash
npm run build
npm run build  # Second run should be faster with cache
```

**Success Criteria:**

- ✅ Both apps start with `npm run dev`
- ✅ API responds to requests
- ✅ Web UI loads and functions
- ✅ Login flow works end-to-end
- ✅ PM2 deployment works from apps/api
- ✅ No errors in console or logs

**Rollback Plan (if Phase 1 fails):**

```bash
# Move directories back
mv apps/api be
mv apps/web fe
rm -rf apps/
rm package.json turbo.json .nvmrc
# Restore original structure
```

---

## Phase 2: Backend ESM Migration

**Goal:** Migrate backend from CommonJS to ESM for consistency with frontend and modern Node.js best practices.

**Duration Estimate:** 4-6 hours  
**Risk Level:** 🟡 Medium (significant code changes, but mechanical transformation)

**Prerequisites:**

- ✅ Phase 1 completed and verified
- ✅ All tests passing (or smoke tests if no formal tests)
- ✅ Git commit with Phase 1 changes

### Step 2.1: Update Package Configuration for ESM

**File:** `apps/api/package.json`

**Changes:**

1. Add `"type": "module"` (enables ESM)
2. Update Node engine to `>=20.19.0`
3. Remove `module-alias` from dependencies
4. Remove `_moduleAliases` configuration
5. Add `imports` field for subpath imports

**Updated `apps/api/package.json`:**

```json
{
  "name": "@procurement/api",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=20.19.0"
  },
  "imports": {
    "#shared/*": "./src/shared/*/index.js",
    "#shared/middlewares/*": "./src/shared/middlewares/*.js",
    "#shared/utils/*": "./src/shared/utils/*.js",
    "#modules/*": "./src/modules/*/index.js",
    "#config/*": "./src/config/*.js",
    "#routes": "./src/routes/index.js"
  },
  "scripts": {
    "dev": "NODE_OPTIONS='--experimental-import-meta-resolve' nodemon src/server.js",
    "start": "NODE_OPTIONS='--experimental-import-meta-resolve' node src/server.js"
  }
}
```

**Subpath Imports Explanation:**

- `#shared/*` - Replaces `@shared` module alias
- `#modules/*` - Replaces `@modules` module alias
- `#config/*` - Replaces `@config` module alias
- `#routes` - Replaces `@routes` module alias
- `#` prefix used (Node.js convention, no conflicts with external packages)
- `.js` extension required in imports

### Step 2.2: Remove module-alias Usage

**File:** `apps/api/src/server.js`

**Before:**

```javascript
// Register module aliases
require('module-alias/register');

const app = require('./app');
// ... rest of file
```

**After:**

```javascript
import app from './app.js';
// ... rest of file
```

**Pattern to apply everywhere:**

- Remove `require('module-alias/register')`
- Remove any `module-alias` imports

### Step 2.3: Convert Module Syntax - Core Files

**Conversion Pattern:**

**CommonJS:**

```javascript
const express = require('express');
const { someFunction } = require('./utils');

function myFunction() {
  // ...
}

module.exports = myFunction;
// or
module.exports = { myFunction, otherFunction };
```

**ESM:**

```javascript
import express from 'express';
import { someFunction } from './utils.js';

function myFunction() {
  // ...
}

export default myFunction;
// or
export { myFunction, otherFunction };
```

**Critical Rules:**

1. **Always add `.js` extension** to relative imports: `'./utils.js'`
2. **No extension for npm packages:** `'express'`
3. **Named exports:** `export { name }` or `export const name = ...`
4. **Default exports:** `export default value`
5. **Mixed exports:** Can have both default and named
6. **Import order:** External packages first, then local imports

**Files to Convert (order matters):**

1. **`apps/api/src/server.js`** (entry point)
2. **`apps/api/src/app.js`** (Express app)
3. **`apps/api/src/config/*.js`** (all config files)
4. **`apps/api/src/shared/utils/*.js`** (shared utilities)
5. **`apps/api/src/shared/middlewares/*.js`** (shared middleware)
6. **`apps/api/src/routes/index.js`** (main router)
7. **All module files:** `apps/api/src/modules/**/*.js`

### Step 2.4: Update Module Aliases to Subpath Imports

**Find and replace across all files:**

| Old (module-alias)                   | New (subpath import)                           |
| ------------------------------------ | ---------------------------------------------- |
| `require('@shared/utils/...')`       | `import ... from '#shared/utils/....js'`       |
| `require('@shared/middlewares/...')` | `import ... from '#shared/middlewares/....js'` |
| `require('@modules/...')`            | `import ... from '#modules/....js'`            |
| `require('@config/...')`             | `import ... from '#config/....js'`             |
| `require('@routes')`                 | `import ... from '#routes'`                    |

**Example Transformation:**

**Before:**

```javascript
const { AppError } = require('@shared/utils/error');
const asyncHandler = require('@shared/utils/asyncHandler');
const validate = require('@shared/middlewares/validate');
```

**After:**

```javascript
import { AppError } from '#shared/utils/error.js';
import asyncHandler from '#shared/utils/asyncHandler.js';
import validate from '#shared/middlewares/validate.js';
```

### Step 2.5: Fix CommonJS-Specific Patterns

#### Pattern 1: `__dirname` and `__filename`

**CommonJS:**

```javascript
const path = require('path');
const logPath = path.join(__dirname, '../logs');
```

**ESM (Node.js 20.11+):**

```javascript
import path from 'path';
const logPath = path.join(import.meta.dirname, '../logs');
```

**Alternative (if Node < 20.11):**

```javascript
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logPath = path.join(__dirname, '../logs');
```

**Recommended:** Use `import.meta.dirname` (available in Node 20.11+)

#### Pattern 2: Dynamic Requires

**CommonJS:**

```javascript
const config = require(`./${env}.config.js`);
```

**ESM:**

```javascript
const config = await import(`./${env}.config.js`);
// or use static imports with switch/if
```

#### Pattern 3: require.resolve

**CommonJS:**

```javascript
const modulePath = require.resolve('./module');
```

**ESM:**

```javascript
import { resolve } from 'import-meta-resolve';
const modulePath = await resolve('./module', import.meta.url);
```

#### Pattern 4: JSON Imports

**CommonJS:**

```javascript
const package = require('./package.json');
```

**ESM (Node.js 20.10+):**

```javascript
import packageJson from './package.json' with { type: 'json' };
// or
import { readFileSync } from 'fs';
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
```

### Step 2.6: Update Drizzle Client Import

**File:** `apps/api/src/config/drizzle.js`

**Before:**

```javascript
const { Drizzle } = require('@drizzle/client');
const { createDrizzle } = require('@drizzle/adapter-mariadb');
const pool = require('./database');

// ... drizzle client setup

module.exports = drizzle;
```

**After:**

```javascript
import { Drizzle } from '@drizzle/client';
import { createDrizzle } from '@drizzle/adapter-mariadb';
import pool from './database.js';

// ... drizzle client setup

export default drizzle;
```

**Note:** Drizzle Client fully supports ESM, no additional configuration needed.

### Step 2.7: Update Express App Setup

**File:** `apps/api/src/app.js`

**Before:**

```javascript
const express = require('express');
const helmet = require('helmet');
// ... other imports

const app = express();

// ... middleware setup

module.exports = app;
```

**After:**

```javascript
import express from 'express';
import helmet from 'helmet';
// ... other imports

const app = express();

// ... middleware setup

export default app;
```

### Step 2.8: Convert All Module Controllers, Repositories, Routes

**Apply transformation to each module systematically.**

**Example: Auth Module**

**File:** `apps/api/src/modules/auth/auth.controller.js`

**Before:**

```javascript
const bcrypt = require('bcrypt');
const { AppError } = require('@shared/utils/error');
const authRepository = require('./auth.repository');

const login = async (req, res) => {
  // ... implementation
};

module.exports = {
  login,
  // ... other exports
};
```

**After:**

```javascript
import bcrypt from 'bcrypt';
import { AppError } from '#shared/utils/error.js';
import * as authRepository from './auth.repository.js';

export const login = async (req, res) => {
  // ... implementation
};

// or keep as:
const login = async (req, res) => {
  // ... implementation
};

export { login };
```

**File:** `apps/api/src/modules/auth/auth.repository.js`

**Before:**

```javascript
const drizzle = require('@config/drizzle');

const findUser = async (username) => {
  // ... implementation
};

module.exports = {
  findUser,
  // ... other exports
};
```

**After:**

```javascript
import drizzle from '#config/drizzle.js';

export const findUser = async (username) => {
  // ... implementation
};

// or
const findUser = async (username) => {
  // ... implementation
};

export { findUser };
```

**File:** `apps/api/src/modules/auth/auth.routes.js`

**Before:**

```javascript
const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const validate = require('@shared/middlewares/validate');
const authValidation = require('./auth.validation');

router.post('/login', validate(authValidation.login), authController.login);

module.exports = router;
```

**After:**

```javascript
import express from 'express';
import * as authController from './auth.controller.js';
import validate from '#shared/middlewares/validate.js';
import * as authValidation from './auth.validation.js';

const router = express.Router();

router.post('/login', validate(authValidation.login), authController.login);

export default router;
```

**Repeat for all modules:**

- `modules/api-token/*`
- `modules/master-data/items/*`
- `modules/master-data/vendors/*`
- `modules/master-data/vessels/*`
- `modules/profile/*`
- `modules/vessel-request/*`

### Step 2.9: Update Main Routes File

**File:** `apps/api/src/routes/index.js`

**Before:**

```javascript
const express = require('express');
const router = express.Router();

const authRoutes = require('@modules/auth/auth.routes');
const tokenRoutes = require('@modules/api-token/token.routes');
// ... other routes

router.use('/auth', authRoutes);
router.use('/token', tokenRoutes);
// ... other routes

module.exports = router;
```

**After:**

```javascript
import express from 'express';
import authRoutes from '#modules/auth/auth.routes.js';
import tokenRoutes from '#modules/api-token/token.routes.js';
// ... other routes

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/token', tokenRoutes);
// ... other routes

export default router;
```

### Step 2.10: Test Phase 2 Completion

**Verification Checklist:**

1. **No CommonJS syntax remains:**

```bash
cd apps/api
# Should return no results:
grep -r "require(" src/
grep -r "module.exports" src/
```

2. **All imports have .js extension:**

```bash
# Check for missing extensions in relative imports:
grep -r "from '\\./" src/ | grep -v "\\.js'"
# Should return no results
```

3. **Server starts:**

```bash
npm run dev
# Should start without errors
# Watch for any ESM-specific errors
```

4. **API endpoints work:**

```bash
# Test token generation
curl http://localhost:3000/api/token

# Test login (use actual credentials from your system)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Test authenticated endpoints
curl http://localhost:3000/api/master-data/vessels \
  -H "Authorization: Bearer YOUR_TOKEN"
```

5. **Frontend still works:**

```bash
cd apps/web
npm run dev
# Open http://localhost:5173
# Test login flow
# Test CRUD operations (create vessel, request, etc.)
```

6. **PM2 deployment:**

```bash
cd apps/api
npm run pm2:start:dev
npm run pm2:status
# Should show running
npm run pm2:logs
# Check for errors
npm run pm2:delete
```

7. **Drizzle operations:**

```bash
cd apps/api
npx drizzle migrate status
npx drizzle-kit generate
# Should work without errors
```

**Success Criteria:**

- ✅ No CommonJS syntax in codebase
- ✅ All imports use ESM syntax with `.js` extensions
- ✅ Server starts and responds to requests
- ✅ All API endpoints functional
- ✅ Frontend can communicate with backend
- ✅ PM2 deployment works
- ✅ Drizzle migrations and client work
- ✅ No runtime errors in logs

**Common Issues & Solutions:**

| Issue                                | Cause                      | Solution                                 |
| ------------------------------------ | -------------------------- | ---------------------------------------- |
| `Cannot use import outside a module` | Missing `"type": "module"` | Add to package.json                      |
| `Cannot find module './file'`        | Missing `.js` extension    | Add `.js` to all relative imports        |
| `__dirname is not defined`           | CommonJS global in ESM     | Use `import.meta.dirname`                |
| `require is not defined`             | Missed CommonJS syntax     | Convert to `import`                      |
| Module alias not working             | Old `@shared` syntax       | Update to `#shared` subpath imports      |
| Circular dependency error            | Mutual imports             | Refactor to remove circular dependencies |

**Rollback Plan (if Phase 2 fails):**

```bash
# Git rollback
git checkout apps/api
git clean -fd apps/api

# Or restore from backup
# Make sure to create git commit after Phase 1!
```

---

## Phase 3: Shared Packages

**Goal:** Create shared packages for types, validation schemas, and configuration to enable code reuse and type safety across API and Web.

**Duration Estimate:** 6-8 hours  
**Risk Level:** 🟢 Low (additive changes, doesn't break existing functionality)

**Prerequisites:**

- ✅ Phase 1 and 2 completed and verified
- ✅ Backend on ESM
- ✅ Git commit with Phase 2 changes

### Step 3.1: Create Package Structure

**Actions:**

```bash
cd d:/personal-project/Procurement

# Create packages directory
mkdir packages

# Create package directories
mkdir packages/types
mkdir packages/validators
mkdir packages/config

# Create src directories
mkdir packages/types/src
mkdir packages/validators/src
mkdir packages/config/src
```

### Step 3.2: Set Up TypeScript for Packages

**Install TypeScript at root:**

```bash
npm install -D -w typescript @types/node
```

**Create root `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  },
  "exclude": ["node_modules", "dist", "build"]
}
```

### Step 3.3: Create `@procurement/types` Package

**File:** `packages/types/package.json`

```json
{
  "name": "@procurement/types",
  "version": "1.0.0",
  "description": "Shared TypeScript types for Procurement system",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*.ts"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

**File:** `packages/types/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Create Type Files Based on Drizzle Schema:**

**File:** `packages/types/src/user.ts`

```typescript
export enum UserType {
  ADMIN = 'ADMIN',
  OFFICE = 'OFFICE',
  CREW = 'CREW',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum Department {
  DECK = 'DECK',
  ENGINE = 'ENGINE',
  STEWARD = 'STEWARD',
  KITCHEN = 'KITCHEN',
}

export interface User {
  id: string;
  username: string;
  password?: string; // Never send to frontend
  name: string;
  email: string;
  phone: string;
  userType: UserType;
  department?: Department | null;
  position?: string | null;
  vesselId?: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDTO {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  userType: UserType;
  department?: Department | null;
  position?: string | null;
  vesselId?: string | null;
  status: UserStatus;
}
```

**File:** `packages/types/src/vessel.ts`

```typescript
export interface Vessel {
  id: string;
  vesselName: string;
  vesselType: string;
  flag: string;
  imo?: string | null;
  callSign?: string | null;
  owner?: string | null;
  operator?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

export interface VesselStock {
  id: string;
  vesselId: string;
  itemId: string;
  quantity: number;
  unit: string;
  lastUpdated: Date;
  remarks?: string | null;
}
```

**File:** `packages/types/src/request.ts`

```typescript
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum RequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface VesselRequest {
  id: string;
  vesselId: string;
  requestNumber: string;
  requestDate: Date;
  requiredDate?: Date | null;
  priority: Priority;
  status: RequestStatus;
  requestedBy: string;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  remarks?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VesselRequestItem {
  id: string;
  requestId: string;
  itemId: string;
  quantity: number;
  unit: string;
  remarks?: string | null;
  approvedQuantity?: number | null;
}

export interface VesselRequestWithItems extends VesselRequest {
  items: VesselRequestItem[];
}
```

**File:** `packages/types/src/item.ts`

```typescript
export enum Unit {
  PCS = 'PCS',
  KG = 'KG',
  LITER = 'LITER',
  BOX = 'BOX',
  BOTTLE = 'BOTTLE',
  PACK = 'PACK',
  METER = 'METER',
  SET = 'SET',
}

export interface ItemCategory {
  id: string;
  categoryName: string;
  code: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  categoryId: string;
  description?: string | null;
  unit: Unit;
  minStock?: number | null;
  maxStock?: number | null;
  reorderLevel?: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemWithCategory extends Item {
  category: ItemCategory;
}
```

**File:** `packages/types/src/vendor.ts`

```typescript
export enum CategoryVendor {
  FOOD = 'FOOD',
  SPARE_PART = 'SPARE_PART',
  CHEMICAL = 'CHEMICAL',
  EQUIPMENT = 'EQUIPMENT',
  SERVICE = 'SERVICE',
  OTHER = 'OTHER',
}

export interface Vendor {
  id: string;
  vendorCode: string;
  vendorName: string;
  category: CategoryVendor;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  contactPerson?: string | null;
  paymentTerms?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

**File:** `packages/types/src/api.ts`

```typescript
// API Request/Response types

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Auth API types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    userType: string;
  };
  token: string;
}

export interface TokenRequest {
  deviceId: string;
}

export interface TokenResponse {
  token: string;
  expiresAt: Date;
}
```

**File:** `packages/types/src/index.ts`

```typescript
// User types
export * from './user.js';

// Vessel types
export * from './vessel.js';

// Request types
export * from './request.js';

// Item types
export * from './item.js';

// Vendor types
export * from './vendor.js';

// API types
export * from './api.js';
```

### Step 3.4: Create `@procurement/config` Package

**File:** `packages/config/package.json`

```json
{
  "name": "@procurement/config",
  "version": "1.0.0",
  "description": "Shared configuration constants for Procurement system",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*.ts"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

**File:** `packages/config/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**File:** `packages/config/src/routes.ts`

```typescript
/**
 * API route definitions
 * Single source of truth for route paths
 */

export const API_BASE = '/api';

export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
} as const;

export const TOKEN_ROUTES = {
  GENERATE: '/token',
  VALIDATE: '/token/validate',
} as const;

export const VESSEL_ROUTES = {
  LIST: '/master-data/vessels',
  CREATE: '/master-data/vessels',
  GET: (id: string) => `/master-data/vessels/${id}`,
  UPDATE: (id: string) => `/master-data/vessels/${id}`,
  DELETE: (id: string) => `/master-data/vessels/${id}`,
} as const;

export const ITEM_ROUTES = {
  LIST: '/master-data/items',
  CREATE: '/master-data/items',
  GET: (id: string) => `/master-data/items/${id}`,
  UPDATE: (id: string) => `/master-data/items/${id}`,
  DELETE: (id: string) => `/master-data/items/${id}`,
} as const;

export const VENDOR_ROUTES = {
  LIST: '/master-data/vendors',
  CREATE: '/master-data/vendors',
  GET: (id: string) => `/master-data/vendors/${id}`,
  UPDATE: (id: string) => `/master-data/vendors/${id}`,
  DELETE: (id: string) => `/master-data/vendors/${id}`,
} as const;

export const REQUEST_ROUTES = {
  LIST: '/vessel-requests',
  CREATE: '/vessel-requests',
  GET: (id: string) => `/vessel-requests/${id}`,
  UPDATE: (id: string) => `/vessel-requests/${id}`,
  DELETE: (id: string) => `/vessel-requests/${id}`,
  APPROVE: (id: string) => `/vessel-requests/${id}/approve`,
  REJECT: (id: string) => `/vessel-requests/${id}/reject`,
} as const;

export const PROFILE_ROUTES = {
  GET: '/profile',
  UPDATE: '/profile',
  CHANGE_PASSWORD: '/profile/change-password',
} as const;
```

**File:** `packages/config/src/constants.ts`

```typescript
/**
 * Shared constants across API and Web
 */

export const APP_NAME = 'Procurement Vessel Management System';
export const APP_VERSION = '1.0.0';

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

// Token configuration
export const TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
export const JWT_EXPIRES_IN = '24h';

// Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid username or password',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden resource',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  TOKEN_EXPIRED: 'Token expired',
  TOKEN_INVALID: 'Invalid token',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  CREATE_SUCCESS: 'Created successfully',
  UPDATE_SUCCESS: 'Updated successfully',
  DELETE_SUCCESS: 'Deleted successfully',
} as const;
```

**File:** `packages/config/src/index.ts`

```typescript
export * from './routes.js';
export * from './constants.js';
```

### Step 3.5: Create `@procurement/validators` Package

**File:** `packages/validators/package.json`

```json
{
  "name": "@procurement/validators",
  "version": "1.0.0",
  "description": "Shared Zod validation schemas for Procurement system",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*.ts"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@procurement/types": "workspace:*",
    "typescript": "^5.7.3"
  }
}
```

**File:** `packages/validators/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [{ "path": "../types" }]
}
```

**File:** `packages/validators/src/auth.ts`

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const tokenSchema = z.object({
  body: z.object({
    deviceId: z.string().min(1, 'Device ID is required'),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type TokenInput = z.infer<typeof tokenSchema>;
```

**File:** `packages/validators/src/vessel.ts`

```typescript
import { z } from 'zod';

export const createVesselSchema = z.object({
  body: z.object({
    vesselName: z.string().min(1, 'Vessel name is required'),
    vesselType: z.string().min(1, 'Vessel type is required'),
    flag: z.string().min(1, 'Flag is required'),
    imo: z.string().optional(),
    callSign: z.string().optional(),
    owner: z.string().optional(),
    operator: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  }),
});

export const updateVesselSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid vessel ID'),
  }),
  body: z.object({
    vesselName: z.string().min(1).optional(),
    vesselType: z.string().min(1).optional(),
    flag: z.string().min(1).optional(),
    imo: z.string().optional(),
    callSign: z.string().optional(),
    owner: z.string().optional(),
    operator: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});

export const deleteVesselSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid vessel ID'),
  }),
});

export type CreateVesselInput = z.infer<typeof createVesselSchema>;
export type UpdateVesselInput = z.infer<typeof updateVesselSchema>;
export type DeleteVesselInput = z.infer<typeof deleteVesselSchema>;
```

**File:** `packages/validators/src/request.ts`

```typescript
import { z } from 'zod';
import { Priority, RequestStatus } from '@procurement/types';

export const createRequestSchema = z.object({
  body: z.object({
    vesselId: z.string().uuid('Invalid vessel ID'),
    requestDate: z.string().datetime().or(z.date()),
    requiredDate: z.string().datetime().or(z.date()).optional(),
    priority: z.nativeEnum(Priority),
    remarks: z.string().optional(),
    items: z
      .array(
        z.object({
          itemId: z.string().uuid('Invalid item ID'),
          quantity: z.number().positive('Quantity must be positive'),
          unit: z.string(),
          remarks: z.string().optional(),
        })
      )
      .min(1, 'At least one item is required'),
  }),
});

export const updateRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid request ID'),
  }),
  body: z.object({
    vesselId: z.string().uuid().optional(),
    requestDate: z.string().datetime().or(z.date()).optional(),
    requiredDate: z.string().datetime().or(z.date()).optional(),
    priority: z.nativeEnum(Priority).optional(),
    status: z.nativeEnum(RequestStatus).optional(),
    remarks: z.string().optional(),
    items: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          itemId: z.string().uuid(),
          quantity: z.number().positive(),
          unit: z.string(),
          remarks: z.string().optional(),
        })
      )
      .optional(),
  }),
});

export const approveRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid request ID'),
  }),
  body: z.object({
    remarks: z.string().optional(),
    items: z
      .array(
        z.object({
          id: z.string().uuid(),
          approvedQuantity: z.number().positive('Approved quantity must be positive'),
        })
      )
      .optional(),
  }),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
export type ApproveRequestInput = z.infer<typeof approveRequestSchema>;
```

**File:** `packages/validators/src/pagination.ts`

```typescript
import { z } from 'zod';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '@procurement/config';

export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
    limit: z.coerce.number().int().positive().max(MAX_LIMIT).default(DEFAULT_LIMIT),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    search: z.string().optional(),
  }),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
```

**File:** `packages/validators/src/index.ts`

```typescript
export * from './auth.js';
export * from './vessel.js';
export * from './request.js';
export * from './pagination.js';
```

### Step 3.6: Update Turbo Configuration for Packages

**File:** `turbo.json`

**Add package build tasks:**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env", "tsconfig.json"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "format": {
      "cache": false
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

**Key points:**

- `"dependsOn": ["^build"]` ensures packages build before apps
- `^build` means "build all dependencies first"

### Step 3.7: Add Shared Packages to API Dependencies

**File:** `apps/api/package.json`

**Add to dependencies:**

```json
{
  "dependencies": {
    "@procurement/types": "workspace:*",
    "@procurement/validators": "workspace:*",
    "@procurement/config": "workspace:*"
  }
}
```

**Update TypeScript support for JSDoc (optional but recommended):**

Although API remains JavaScript, you can use JSDoc comments to get type checking:

**Example in controller:**

```javascript
import { loginSchema } from '@procurement/validators';
import { ERROR_MESSAGES } from '@procurement/config';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const login = async (req, res) => {
  // ... implementation with type hints
};
```

### Step 3.8: Add Shared Packages to Web Dependencies

**File:** `apps/web/package.json`

**Add to dependencies:**

```json
{
  "dependencies": {
    "@procurement/types": "workspace:*",
    "@procurement/config": "workspace:*"
  }
}
```

**Note:** Web doesn't need validators (validation happens server-side).

### Step 3.9: Update API to Use Shared Validators

**Example: Auth validation**

**File:** `apps/api/src/modules/auth/auth.validation.js`

**Before:**

```javascript
import { z } from 'zod';

export const login = z.object({
  body: z.object({
    username: z.string().min(3),
    password: z.string().min(6),
  }),
});
```

**After:**

```javascript
import { loginSchema } from '@procurement/validators';

// Re-export for backward compatibility
export const login = loginSchema;

// Or directly use in routes:
// import { loginSchema } from '@procurement/validators';
// router.post('/login', validate(loginSchema), authController.login);
```

**Repeat for all validation files in API modules.**

### Step 3.10: Update Web to Use Shared Types

**Example: Using types in Vue components**

**File:** `apps/web/src/features/vessel/views/Index.vue`

**Before:**

```vue
<script setup>
import { ref } from 'vue';

const vessels = ref([]);
const loading = ref(false);

const fetchVessels = async () => {
  // ... API call
};
</script>
```

**After (with JSDoc types):**

```vue
<script setup>
import { ref } from 'vue';

/**
 * @typedef {import('@procurement/types').Vessel} Vessel
 */

/** @type {import('vue').Ref<Vessel[]>} */
const vessels = ref([]);
const loading = ref(false);

const fetchVessels = async () => {
  // ... API call with type hints
};
</script>
```

**Or migrate to TypeScript SFC:**

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { Vessel } from '@procurement/types';

const vessels = ref<Vessel[]>([]);
const loading = ref(false);

const fetchVessels = async () => {
  // ... fully typed
};
</script>
```

### Step 3.11: Update API Services with Shared Constants

**Example: HTTP service**

**File:** `apps/web/src/services/http.js`

**Add route imports:**

```javascript
import axios from 'axios';
import { API_BASE, AUTH_ROUTES, VESSEL_ROUTES } from '@procurement/config';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
});

// Use route constants
export const login = (credentials) => {
  return http.post(AUTH_ROUTES.LOGIN, credentials);
};

export const getVessels = (params) => {
  return http.get(VESSEL_ROUTES.LIST, { params });
};

// ...
```

### Step 3.12: Install Package Dependencies

**Commands:**

```bash
cd d:/personal-project/Procurement

# Install all workspace dependencies
npm install

# This will:
# 1. Link shared packages to apps
# 2. Install package dependencies (zod for validators)
# 3. Hoist common dependencies to root
```

### Step 3.13: Build Shared Packages

**Commands:**

```bash
npm run build

# Or build specific packages:
cd packages/types && npm run build
cd packages/config && npm run build
cd packages/validators && npm run build
```

**Watch mode during development:**

```bash
# In separate terminals:
cd packages/types && npm run dev
cd packages/config && npm run dev
cd packages/validators && npm run dev
```

### Step 3.14: Test Phase 3 Completion

**Verification Checklist:**

1. **Packages build successfully:**

```bash
npm run build
# Check dist/ directories created in each package
ls packages/types/dist
ls packages/config/dist
ls packages/validators/dist
```

2. **API imports shared packages:**

```bash
cd apps/api
# Check imports resolve
node -e "import('@procurement/types').then(console.log)"
node -e "import('@procurement/validators').then(console.log)"
node -e "import('@procurement/config').then(console.log)"
```

3. **Web imports shared packages:**

```bash
cd apps/web
# Vite should resolve workspace packages
npm run build
# Should build without errors
```

4. **Type safety works:**

```bash
# If using TypeScript
npx tsc --noEmit
# Should show no errors (or only expected ones)
```

5. **Full application works:**

```bash
npm run dev
# Both API and Web start
# Open http://localhost:5173
# Test full login and CRUD flows
```

6. **Shared validators work:**

- Test API validation with invalid data
- Verify Zod errors returned correctly
- Check error messages match new shared constants

7. **Hot reload works:**

- Change a type in `packages/types/src/user.ts`
- Verify both API and Web detect change
- Verify rebuild triggers (with watch mode)

**Success Criteria:**

- ✅ All packages build without errors
- ✅ API imports and uses shared packages
- ✅ Web imports and uses shared packages
- ✅ Type safety validated (no import errors)
- ✅ Validation schemas work identically to before
- ✅ Full application flow works end-to-end
- ✅ Hot reload works for package changes
- ✅ No duplicate code between API and Web

**Common Issues & Solutions:**

| Issue                  | Cause                      | Solution                                    |
| ---------------------- | -------------------------- | ------------------------------------------- |
| Package not found      | Not installed              | Run `npm install` at root                   |
| Type errors            | Wrong import path          | Use `@procurement/types` not relative path  |
| Circular dependency    | Types depend on validators | Refactor: types should have no deps         |
| Vite can't resolve     | Missing in package.json    | Add to `apps/web/package.json` dependencies |
| Build fails            | TypeScript error           | Fix type errors in packages                 |
| Watch mode not working | Not using `tsc --watch`    | Run `npm run dev` in package                |

---

## Post-Migration Tasks

### 1. Version Control Cleanup

**Actions:**

1. **Remove `drizzle/migrations/` from `.gitignore`:**

```bash
# Edit apps/api/.gitignore
# Remove line: drizzle/migrations/
```

2. **Commit migration history:**

```bash
git add apps/api/drizzle/migrations/
git commit -m "chore: add Drizzle migration history to version control"
```

3. **Create comprehensive `.gitignore`:**

- Already done in Phase 1
- Verify no critical files ignored

### 2. Update Documentation

**Actions:**

1. **Update root README.md:**

- Add monorepo structure overview
- Add development setup instructions
- Add workspace commands

2. **Update API README:**

- Move to `apps/api/README.md`
- Add ESM migration notes
- Update import examples

3. **Update Web README:**

- Move to `apps/web/README.md`
- Add shared package usage
- Update type safety notes

4. **Create DEVELOPMENT.md:**

- Development workflow
- Package development guide
- Turborepo caching guide

### 3. Set Up Code Quality Tools

**ESLint Configuration:**

**File:** `.eslintrc.json` (root)

```json
{
  "root": true,
  "env": {
    "node": true,
    "es2022": true
  },
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "no-console": "off"
  },
  "overrides": [
    {
      "files": ["packages/**/*.ts"],
      "parser": "@typescript-eslint/parser",
      "plugins": ["@typescript-eslint"],
      "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"]
    }
  ]
}
```

**Install ESLint:**

```bash
npm install -D -w eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

**Add lint script to root package.json:**

```json
{
  "scripts": {
    "lint": "turbo lint",
    "lint:fix": "turbo lint -- --fix"
  }
}
```

**Add lint scripts to each package/app:**

```json
{
  "scripts": {
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix"
  }
}
```

### 4. CI/CD Pipeline Setup (Future)

**Recommended: GitHub Actions**

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.19.0'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Test
        run: npm run test
```

### 5. Testing Framework Setup (Future)

**Recommended Stack:**

- **API:** Vitest + Supertest
- **Web:** Vitest + Vue Test Utils
- **E2E:** Playwright

**Phase 4 (Future):** Comprehensive testing setup.

### 6. Performance Optimization

**Turborepo Remote Caching:**

```bash
# Link to Vercel Remote Cache (free for personal projects)
npx turbo login
npx turbo link
```

**Benefits:**

- Share build cache across team
- Faster CI/CD builds
- Skip unchanged package builds

### 7. Deployment Updates

**PM2 Ecosystem Update:**

**File:** `apps/api/ecosystem.config.js`

**No changes needed** - PM2 still works from `apps/api/` directory.

**Deployment script (example):**

```bash
#!/bin/bash
# deploy.sh

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build packages
npm run build

# Restart API with PM2
cd apps/api
npm run pm2:reload

# Build and deploy web (example for Nginx)
cd ../web
npm run build
rsync -av dist/ /var/www/html/
```

---

## Troubleshooting Guide

### Issue: Turborepo Command Not Found

**Symptom:**

```bash
npm run dev
# Error: turbo: command not found
```

**Solution:**

```bash
npm install -D turbo -w
# Force reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Package Not Found

**Symptom:**

```bash
Error: Cannot find package '@procurement/types'
```

**Solution:**

```bash
# Check package name in package.json
cat packages/types/package.json | grep "name"

# Reinstall workspace dependencies
npm install

# Check if linked correctly
ls node_modules/@procurement/
# Should show: types, config, validators
```

### Issue: TypeScript Errors in Packages

**Symptom:**

```bash
npm run build
# TypeScript compilation errors
```

**Solution:**

```bash
# Check tsconfig.json extends root
cat packages/types/tsconfig.json

# Fix type errors
cd packages/types
npx tsc --noEmit
# Address each error

# Rebuild
npm run build
```

### Issue: ESM Import Errors

**Symptom:**

```bash
Error [ERR_MODULE_NOT_FOUND]: Cannot find module './file'
```

**Solution:**

```bash
# Add .js extension to all relative imports
# Before: import x from './file'
# After:  import x from './file.js'

# Check package.json has "type": "module"
cat apps/api/package.json | grep "type"
```

### Issue: Circular Dependencies

**Symptom:**

```bash
ReferenceError: Cannot access 'X' before initialization
```

**Solution:**

1. Identify circular dependency:

```bash
npm install -g madge
madge --circular apps/api/src
```

2. Refactor to break cycle:

- Extract shared interface to separate file
- Use dependency injection
- Lazy import: `const X = await import('./x.js')`

### Issue: PM2 Won't Start After Migration

**Symptom:**

```bash
npm run pm2:start
# PM2 error or constant restart
```

**Solution:**

```bash
# Check PM2 logs
npm run pm2:logs

# Common fixes:
# 1. Check ecosystem.config.js path
# 2. Verify "type": "module" in package.json
# 3. Check Node version: node --version
# 4. Ensure all imports have .js extensions
# 5. Test server manually first
npm run start
```

### Issue: Vite Can't Resolve Workspace Package

**Symptom:**

```bash
npm run dev
# Vite error: Failed to resolve '@procurement/types'
```

**Solution:**

```bash
# 1. Check package.json dependencies
cat apps/web/package.json | grep "@procurement"

# 2. Ensure workspace protocol used
# Should be: "workspace:*" not "^1.0.0"

# 3. Delete node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install

# 4. Check Vite config doesn't exclude node_modules
cat apps/web/vite.config.js
```

### Issue: Hot Reload Not Working for Packages

**Symptom:**

- Change file in `packages/types/src/user.ts`
- Apps don't rebuild

**Solution:**

```bash
# Run package in watch mode
cd packages/types
npm run dev  # tsc --watch

# Or use Turborepo watch (future enhancement)
# Add to turbo.json:
# "dev": { "dependsOn": ["^dev"] }
```

---

## Performance Benchmarks

**Expected improvements after migration:**

| Metric           | Before   | After | Improvement                   |
| ---------------- | -------- | ----- | ----------------------------- |
| Initial install  | ~60s     | ~45s  | 25% faster (with hoisting)    |
| Repeated builds  | No cache | ~5s   | 95% faster (with Turbo cache) |
| Dev server start | ~3s      | ~3s   | Same (parallel start)         |
| Type safety      | None     | Full  | ✅ Reduced runtime errors     |
| Code duplication | ~15%     | 0%    | ✅ DRY principle              |

---

## Team Workflow

### Development Workflow

1. **Start development:**

```bash
npm run dev
# Starts all apps and watches packages
```

2. **Work on API:**

```bash
cd apps/api
# Edit files
# Nodemon auto-restarts
```

3. **Work on Web:**

```bash
cd apps/web
# Edit files
# Vite HMR updates
```

4. **Work on shared package:**

```bash
cd packages/types
npm run dev  # tsc --watch
# Edit types
# API/Web auto-rebuild
```

5. **Format code:**

```bash
npm run format
```

6. **Lint:**

```bash
npm run lint
npm run lint:fix
```

7. **Build for production:**

```bash
npm run build
```

### Git Workflow

**Recommended branch structure:**

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `hotfix/*` - Emergency fixes

**Commit message convention:**

```
type(scope): description

feat(api): add vessel request approval endpoint
fix(web): resolve token expiration handling
chore(deps): update Drizzle to v7.3.1
docs(readme): add monorepo setup instructions
refactor(validators): extract common schemas
```

### Code Review Checklist

- [ ] Code follows ESM module syntax
- [ ] All relative imports have `.js` extensions
- [ ] Shared types used from `@procurement/types`
- [ ] Shared validators used from `@procurement/validators`
- [ ] Shared constants used from `@procurement/config`
- [ ] No duplicate code between apps
- [ ] Prettier formatted
- [ ] ESLint passes
- [ ] No console.log statements (use logger)
- [ ] Error handling implemented
- [ ] API changes reflected in types

---

## Migration Checklist

### Pre-Migration

- [ ] Backup current codebase
- [ ] Create git branch: `migration/turborepo`
- [ ] Document current API endpoints
- [ ] Export environment variables
- [ ] Test database backup/restore

### Phase 1: Turborepo Foundation

- [ ] Create root `package.json` with workspaces
- [ ] Install Turborepo
- [ ] Create `turbo.json` configuration
- [ ] Create `.nvmrc` with Node 20.19.0
- [ ] Create root `.gitignore`
- [ ] Create root `.prettierrc`
- [ ] Move `be/` to `apps/api/`
- [ ] Move `fe/` to `apps/web/`
- [ ] Update `apps/api/package.json` name
- [ ] Update `apps/web/package.json` name
- [ ] Update Node engine versions
- [ ] Run `npm install` at root
- [ ] Test `npm run dev` - both apps start
- [ ] Test API endpoints work
- [ ] Test Web UI works
- [ ] Test login flow end-to-end
- [ ] Test PM2 deployment
- [ ] Git commit: "chore: migrate to Turborepo structure"

### Phase 2: Backend ESM Migration

- [ ] Add `"type": "module"` to `apps/api/package.json`
- [ ] Add `imports` subpath configuration
- [ ] Remove `module-alias` dependency
- [ ] Convert `apps/api/src/server.js` to ESM
- [ ] Convert `apps/api/src/app.js` to ESM
- [ ] Convert all `apps/api/src/config/*.js` to ESM
- [ ] Convert all `apps/api/src/shared/utils/*.js` to ESM
- [ ] Convert all `apps/api/src/shared/middlewares/*.js` to ESM
- [ ] Convert `apps/api/src/routes/index.js` to ESM
- [ ] Convert all module controllers to ESM
- [ ] Convert all module repositories to ESM
- [ ] Convert all module routes to ESM
- [ ] Convert all module validations to ESM
- [ ] Replace `@shared` with `#shared` imports
- [ ] Replace `@modules` with `#modules` imports
- [ ] Replace `@config` with `#config` imports
- [ ] Replace `__dirname` with `import.meta.dirname`
- [ ] Add `.js` extensions to all relative imports
- [ ] Test API starts without errors
- [ ] Test all API endpoints work
- [ ] Test Drizzle operations work
- [ ] Test PM2 deployment works
- [ ] Run format: `npm run format`
- [ ] Git commit: "refactor: migrate API to ESM"

### Phase 3: Shared Packages

- [ ] Create `packages/` directory
- [ ] Install TypeScript at root
- [ ] Create root `tsconfig.json`
- [ ] Create `packages/types/` with package.json
- [ ] Create TypeScript types for all models
- [ ] Create API request/response types
- [ ] Create `packages/config/` with package.json
- [ ] Create shared route constants
- [ ] Create shared configuration constants
- [ ] Create `packages/validators/` with package.json
- [ ] Create Zod schemas for validation
- [ ] Build all packages: `npm run build`
- [ ] Add packages to `apps/api/package.json` dependencies
- [ ] Add packages to `apps/web/package.json` dependencies
- [ ] Run `npm install` at root
- [ ] Update API to use shared validators
- [ ] Update API to use shared constants
- [ ] Update Web to use shared types
- [ ] Update Web to use shared constants
- [ ] Update `turbo.json` with package tasks
- [ ] Test packages build correctly
- [ ] Test API imports packages
- [ ] Test Web imports packages
- [ ] Test full application flow
- [ ] Test hot reload for package changes
- [ ] Run format: `npm run format`
- [ ] Git commit: "feat: add shared packages for types, config, validators"

### Post-Migration

- [ ] Remove `drizzle/migrations/` from `.gitignore`
- [ ] Commit Drizzle migrations to version control
- [ ] Update root README.md with monorepo docs
- [ ] Update API README.md
- [ ] Update Web README.md
- [ ] Set up ESLint configuration
- [ ] Run linter: `npm run lint`
- [ ] Fix lint errors: `npm run lint:fix`
- [ ] Set up CI/CD pipeline (optional)
- [ ] Set up Turborepo remote caching (optional)
- [ ] Update deployment scripts
- [ ] Train team on new workflow
- [ ] Deploy to staging environment
- [ ] Run full regression tests
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Git merge to main: "chore: complete Turborepo migration"

---

## Conclusion

This migration plan provides a comprehensive, phased approach to transitioning from a traditional client-server structure to a modern Turborepo monorepo. By following each phase systematically, you'll achieve:

✅ **Unified codebase** with improved organization  
✅ **Modern ESM modules** for better tree-shaking and performance  
✅ **Type-safe development** with shared types and validators  
✅ **Faster builds** with Turborepo caching  
✅ **Reduced code duplication** with shared packages  
✅ **Better developer experience** with unified tooling

The migration is designed to minimize risk through incremental changes, with comprehensive testing at each phase and clear rollback procedures.

**Next Steps:**

1. Review this plan with your team
2. Schedule migration windows for each phase
3. Begin with Phase 1 (lowest risk)
4. Proceed only after verifying each phase
5. Monitor production closely post-deployment

Good luck with your migration! 🚀
