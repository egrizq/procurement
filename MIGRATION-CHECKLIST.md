# Quick Migration Reference - Turborepo Setup

**Quick reference for migrating to Turborepo monorepo**  
**Full details:** See [MONOREPO-MIGRATION.md](./MONOREPO-MIGRATION.md)

---

## Phase 1: Turborepo Foundation (2-4 hours)

### ✅ Pre-Flight Checklist

- [ ] Backup current codebase
- [ ] Git commit all changes
- [ ] Create migration branch: `git checkout -b migration/turborepo`
- [ ] Verify Node.js >= 20.19.0: `node --version`
- [ ] Document current working features

### Step 1: Create Root Package.json

```bash
cd d:/personal-project/Procurement
```

Create `package.json`:
```json
{
  "name": "procurement-monorepo",
  "version": "1.0.0",
  "private": true,
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
    "clean": "turbo clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "prettier": "^3.8.1"
  }
}
```

### Step 2: Install Turborepo

```bash
npm install
```

### Step 3: Create Configuration Files

**`.nvmrc`:**
```
20.19.0
```

**`turbo.json`:**
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
    }
  }
}
```

**`.prettierrc`:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 100,
  "trailingComma": "es5",
  "arrowParens": "always"
}
```

**`.gitignore`:**
```gitignore
node_modules/
.turbo/
dist/
build/
.env
.env.local
logs/
*.log
.DS_Store
```

### Step 4: Restructure Directories

```bash
# Create apps directory
mkdir apps

# Move backend
mv be apps/api

# Move frontend
mv fe apps/web
```

### Step 5: Update Package Names

**`apps/api/package.json`:**
```json
{
  "name": "@procurement/api",
  "version": "1.0.0",
  "private": true,
  "engines": {
    "node": ">=20.19.0"
  }
}
```

**`apps/web/package.json`:**
```json
{
  "name": "@procurement/web",
  "version": "1.0.0",
  "private": true,
  "engines": {
    "node": ">=20.19.0"
  }
}
```

### Step 6: Install Dependencies

```bash
npm install
```

### Step 7: Test Phase 1

```bash
# Start both servers
npm run dev

# Verify:
# ✅ API running on http://localhost:3000
# ✅ Web running on http://localhost:5173
# ✅ Login flow works
# ✅ API endpoints respond

# Test PM2
cd apps/api
npm run pm2:start:dev
npm run pm2:status
npm run pm2:delete
```

### ✅ Phase 1 Complete

- [ ] Both apps start with `npm run dev`
- [ ] API accessible at port 3000
- [ ] Web accessible at port 5173
- [ ] Login works end-to-end
- [ ] PM2 deployment works
- [ ] Git commit: `git commit -m "chore: migrate to Turborepo structure"`

---

## Phase 2: Backend ESM Migration (4-6 hours)

### Prerequisites
- [ ] Phase 1 completed and committed
- [ ] All features tested and working

### Step 1: Update package.json

**`apps/api/package.json`:**
```json
{
  "name": "@procurement/api",
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
  }
}
```

Remove: `module-alias` from dependencies and `_moduleAliases` config.

### Step 2: Conversion Pattern

**Before (CommonJS):**
```javascript
const express = require('express');
const { something } = require('./utils');
module.exports = myFunction;
```

**After (ESM):**
```javascript
import express from 'express';
import { something } from './utils.js';
export default myFunction;
```

### Step 3: Critical Rules

- ✅ Add `.js` extension to ALL relative imports
- ✅ Replace `@shared` with `#shared`
- ✅ Replace `__dirname` with `import.meta.dirname`
- ✅ Replace `require()` with `import`
- ✅ Replace `module.exports` with `export`

### Step 4: Conversion Order

1. [ ] `src/server.js`
2. [ ] `src/app.js`
3. [ ] `src/config/*.js`
4. [ ] `src/shared/utils/*.js`
5. [ ] `src/shared/middlewares/*.js`
6. [ ] `src/routes/index.js`
7. [ ] All `src/modules/**/*.js`

### Step 5: Find/Replace Commands

```bash
# Check for remaining require()
grep -r "require(" src/

# Check for module.exports
grep -r "module.exports" src/

# Check for missing .js extensions
grep -r "from '\\./" src/ | grep -v "\\.js'"
```

### Step 6: Test Phase 2

```bash
# Start server
npm run dev

# Test all endpoints:
curl http://localhost:3000/api/token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Test PM2
cd apps/api
npm run pm2:start:dev
npm run pm2:logs  # Check for errors
npm run pm2:delete
```

### ✅ Phase 2 Complete

- [ ] No `require()` in codebase
- [ ] No `module.exports` in codebase
- [ ] All imports have `.js` extensions
- [ ] Server starts without errors
- [ ] All endpoints work
- [ ] PM2 works
- [ ] Format code: `npm run format`
- [ ] Git commit: `git commit -m "refactor: migrate API to ESM"`

---

## Phase 3: Shared Packages (6-8 hours)

### Step 1: Create Package Structure

```bash
cd d:/personal-project/Procurement

mkdir -p packages/types/src
mkdir -p packages/config/src
mkdir -p packages/validators/src
```

### Step 2: Install TypeScript

```bash
npm install -D -w typescript @types/node
```

Create root `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "composite": true
  }
}
```

### Step 3: Create @procurement/types

**`packages/types/package.json`:**
```json
{
  "name": "@procurement/types",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
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

**`packages/types/tsconfig.json`:**
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

Create type files: `src/user.ts`, `src/vessel.ts`, `src/request.ts`, `src/item.ts`, `src/vendor.ts`, `src/api.ts`, `src/index.ts`

### Step 4: Create @procurement/config

**`packages/config/package.json`:**
```json
{
  "name": "@procurement/config",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
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

Create: `src/routes.ts`, `src/constants.ts`, `src/index.ts`

### Step 5: Create @procurement/validators

**`packages/validators/package.json`:**
```json
{
  "name": "@procurement/validators",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
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

Create: `src/auth.ts`, `src/vessel.ts`, `src/request.ts`, `src/pagination.ts`, `src/index.ts`

### Step 6: Add Packages to Apps

**`apps/api/package.json`:**
```json
{
  "dependencies": {
    "@procurement/types": "workspace:*",
    "@procurement/validators": "workspace:*",
    "@procurement/config": "workspace:*"
  }
}
```

**`apps/web/package.json`:**
```json
{
  "dependencies": {
    "@procurement/types": "workspace:*",
    "@procurement/config": "workspace:*"
  }
}
```

### Step 7: Install and Build

```bash
npm install
npm run build
```

### Step 8: Use Shared Packages

API example:
```javascript
import { loginSchema } from '@procurement/validators';
import { ERROR_MESSAGES } from '@procurement/config';
```

Web example:
```javascript
import { VESSEL_ROUTES } from '@procurement/config';
import type { Vessel } from '@procurement/types';
```

### Step 9: Test Phase 3

```bash
# Build packages
npm run build

# Check imports resolve
cd apps/api
node -e "import('@procurement/types').then(console.log)"

# Start apps
npm run dev

# Test full flow
# - Login
# - CRUD operations
# - Validation errors
```

### ✅ Phase 3 Complete

- [ ] All packages build successfully
- [ ] API imports packages
- [ ] Web imports packages
- [ ] Types provide IntelliSense
- [ ] Validators work in API
- [ ] Constants used in both apps
- [ ] Full app works end-to-end
- [ ] Git commit: `git commit -m "feat: add shared packages"`

---

## Post-Migration Checklist

### Documentation
- [ ] Update README.md
- [ ] Update API README
- [ ] Update Web README
- [ ] Create/update CHANGELOG.md

### Code Quality
- [ ] Run formatter: `npm run format`
- [ ] Set up ESLint
- [ ] Run linter: `npm run lint`
- [ ] Fix all lint warnings

### Version Control
- [ ] Remove `prisma/migrations/` from `.gitignore`
- [ ] Commit migration files
- [ ] Verify `.gitignore` patterns

### Testing
- [ ] Test all API endpoints
- [ ] Test all UI features
- [ ] Test PM2 deployment
- [ ] Test build process
- [ ] Verify environment variables

### Deployment
- [ ] Update deployment scripts
- [ ] Test staging deployment
- [ ] Update CI/CD (if applicable)
- [ ] Update nginx config (if applicable)
- [ ] Document deployment process

### Team
- [ ] Update team documentation
- [ ] Conduct knowledge transfer
- [ ] Update development setup guide
- [ ] Create troubleshooting guide

---

## Common Issues & Quick Fixes

### Issue: Module Not Found
```bash
rm -rf node_modules package-lock.json
rm -rf apps/*/node_modules packages/*/node_modules
npm install
```

### Issue: Prisma Client Error
```bash
cd apps/api
npx prisma generate
```

### Issue: Port Already in Use
```bash
# Find process
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>
```

### Issue: ESM Import Error
- Add `.js` extension to relative imports
- Check `"type": "module"` in package.json
- Replace `__dirname` with `import.meta.dirname`

### Issue: Turbo Cache Issues
```bash
rm -rf .turbo apps/*/.turbo packages/*/.turbo
npm run build
```

---

## Quick Commands Reference

```bash
# Start development
npm run dev

# Build everything
npm run build

# Format code
npm run format

# Clean build artifacts
npm run clean

# API-specific
cd apps/api
npm run dev              # Start with nodemon
npm run pm2:start:dev    # Start with PM2
npx prisma migrate dev   # Create migration
npx prisma studio        # Open DB GUI

# Web-specific
cd apps/web
npm run dev              # Start Vite
npm run build            # Build for production

# Package-specific
cd packages/types
npm run build            # Build types
npm run dev              # Watch mode
```

---

## Rollback Procedure

If migration fails:

```bash
# Rollback git changes
git checkout .
git clean -fd

# Or restore specific phase
git log --oneline  # Find commit before migration
git reset --hard <commit-hash>

# Or restore from backup
cp -r /path/to/backup/* .
```

---

## Success Indicators

### Phase 1
✅ `npm run dev` starts both apps  
✅ Both apps accessible via browser  
✅ Login works end-to-end  
✅ PM2 deployment works  

### Phase 2
✅ No CommonJS syntax in codebase  
✅ All imports use ESM  
✅ All endpoints functional  
✅ PM2 works with ESM  

### Phase 3
✅ Packages build successfully  
✅ Apps import and use packages  
✅ Type safety working  
✅ Validation works identically  
✅ Full application functional  

---

## Getting Help

- **Full Details:** [MONOREPO-MIGRATION.md](./MONOREPO-MIGRATION.md)
- **Dev Guide:** [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Architecture:** [apps/api/src/ARCHITECTURE.md](./apps/api/src/ARCHITECTURE.md)
- **Frontend:** [apps/web/IMPLEMENTATION.md](./apps/web/IMPLEMENTATION.md)

---

**Remember:** Test after each phase before proceeding!
