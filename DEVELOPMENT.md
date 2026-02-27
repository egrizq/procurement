# Development Guide - Procurement Vessel Management System

**Last Updated:** February 27, 2026  
**Architecture:** Turborepo Monorepo  
**Target Audience:** Developers

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Working with Packages](#working-with-packages)
6. [API Development](#api-development)
7. [Frontend Development](#frontend-development)
8. [Database Management](#database-management)
9. [Testing](#testing)
10. [Debugging](#debugging)
11. [Code Style Guide](#code-style-guide)
12. [Common Tasks](#common-tasks)
13. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- **Node.js:** v20.19.0 or higher (use nvm for version management)
- **npm:** v10.0.0 or higher (comes with Node.js)
- **MySQL/MariaDB:** v8.0+ / v10.5+
- **Git:** Latest version
- **Code Editor:** VS Code (recommended) with extensions:
  - Prisma
  - Vue - Official
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

### Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd Procurement

# 2. Set Node version (if using nvm)
nvm use

# 3. Install dependencies
npm install

# 4. Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Edit .env files with your configuration

# 5. Set up database
cd apps/api
npx prisma migrate dev
npx prisma generate
cd ../..

# 6. Start development servers
npm run dev

# Access:
# - API: http://localhost:3000
# - Web: http://localhost:5173
```

---

## Development Environment Setup

### Node Version Management

**Using nvm (recommended):**
```bash
# Install nvm (if not installed)
# macOS/Linux: https://github.com/nvm-sh/nvm
# Windows: https://github.com/coreybutler/nvm-windows

# Install and use Node 20.19.0
nvm install 20.19.0
nvm use 20.19.0

# Or use .nvmrc
nvm use
```

**Without nvm:**
- Download Node.js 20.19.0+ from https://nodejs.org
- Verify: `node --version` (should show v20.19.0+)

### Database Setup

**MySQL/MariaDB Installation:**

**macOS (Homebrew):**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

**Windows:**
- Download from https://dev.mysql.com/downloads/mysql/
- Or use XAMPP/WAMP

**Create Database:**
```sql
CREATE DATABASE procurement CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'procurement_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON procurement.* TO 'procurement_user'@'localhost';
FLUSH PRIVILEGES;
```

### VS Code Setup

**Install Extensions:**
1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS)
3. Search and install:
   - Prisma
   - Vue - Official
   - ESLint
   - Prettier - Code formatter
   - Tailwind CSS IntelliSense
   - Turbo Console Log

**Workspace Settings (.vscode/settings.json):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[vue]": {
    "editor.defaultFormatter": "Vue.volar"
  },
  "eslint.workingDirectories": [
    "apps/api",
    "apps/web",
    "packages/types",
    "packages/config",
    "packages/validators"
  ],
  "files.exclude": {
    "**/.turbo": true,
    "**/node_modules": true,
    "**/dist": true
  }
}
```

---

## Project Structure

### Monorepo Layout

```
Procurement/
├── apps/                           # Applications
│   ├── api/                        # Backend API (Node.js/Express)
│   │   ├── src/
│   │   │   ├── modules/            # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── api-token/
│   │   │   │   ├── master-data/
│   │   │   │   ├── profile/
│   │   │   │   └── vessel-request/
│   │   │   ├── config/             # Configuration
│   │   │   ├── shared/             # Shared utilities
│   │   │   ├── routes/             # Route aggregation
│   │   │   ├── app.js              # Express app
│   │   │   └── server.js           # Server entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Database schema
│   │   │   └── migrations/         # Migration history
│   │   ├── logs/                   # Application logs
│   │   ├── package.json
│   │   ├── ecosystem.config.js     # PM2 config
│   │   └── .env
│   │
│   └── web/                        # Frontend (Vue.js/Vite)
│       ├── src/
│       │   ├── app/                # App bootstrap
│       │   ├── features/           # Feature modules
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   ├── master-data/
│       │   │   ├── vessel/
│       │   │   └── request/
│       │   ├── components/         # Shared components
│       │   │   ├── base/
│       │   │   └── layout/
│       │   ├── services/           # Services (http, token, notification)
│       │   └── utils/              # Utilities
│       ├── public/
│       ├── package.json
│       ├── vite.config.js
│       └── .env
│
├── packages/                       # Shared packages
│   ├── types/                      # TypeScript types
│   │   ├── src/
│   │   │   ├── user.ts
│   │   │   ├── vessel.ts
│   │   │   ├── request.ts
│   │   │   ├── item.ts
│   │   │   ├── vendor.ts
│   │   │   ├── api.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── config/                     # Shared configuration
│   │   ├── src/
│   │   │   ├── routes.ts
│   │   │   ├── constants.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── validators/                 # Zod validation schemas
│       ├── src/
│       │   ├── auth.ts
│       │   ├── vessel.ts
│       │   ├── request.ts
│       │   ├── pagination.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                           # Documentation
│   ├── MONOREPO-MIGRATION.md
│   ├── DEVELOPMENT.md (this file)
│   ├── API-REFERENCE.md
│   └── ARCHITECTURE.md
│
├── package.json                    # Root package.json
├── turbo.json                      # Turborepo configuration
├── tsconfig.json                   # Root TypeScript config
├── .prettierrc                     # Prettier config
├── .eslintrc.json                  # ESLint config
├── .nvmrc                          # Node version
├── .gitignore                      # Git ignore
└── README.md                       # Project overview
```

### Workspace Dependencies

```
Root
├── apps/api → @procurement/types, @procurement/validators, @procurement/config
├── apps/web → @procurement/types, @procurement/config
└── packages/
    ├── types (no dependencies)
    ├── config (no dependencies)
    └── validators → @procurement/types
```

---

## Development Workflow

### Daily Development

**1. Start Development Servers:**
```bash
# From root - starts all apps and watches packages
npm run dev

# Or start individually:
cd apps/api && npm run dev    # API on port 3000
cd apps/web && npm run dev    # Web on port 5173
```

**2. Work on Features:**
```bash
# Create feature branch
git checkout -b feature/vessel-approval

# Make changes in apps/api or apps/web
# Changes auto-reload (nodemon for API, Vite HMR for Web)

# Stage and commit
git add .
git commit -m "feat(api): add vessel approval endpoint"
```

**3. Work on Shared Packages:**
```bash
# Watch mode for auto-rebuild
cd packages/types
npm run dev  # tsc --watch

# Make changes to types
# API and Web will detect changes and rebuild
```

**4. Format and Lint:**
```bash
# Format all code
npm run format

# Lint and fix
npm run lint
npm run lint:fix
```

**5. Build for Production:**
```bash
# Build all packages and apps
npm run build

# Or build specific app
cd apps/api && npm run build
cd apps/web && npm run build
```

### Branch Strategy

**Branch Types:**
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Emergency production fixes
- `refactor/*` - Code refactoring
- `docs/*` - Documentation updates

**Naming Convention:**
```
feature/vessel-approval-workflow
bugfix/login-token-expiration
hotfix/critical-database-connection
refactor/extract-shared-validation
docs/update-api-endpoints
```

### Commit Message Convention

**Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Build process or auxiliary tool changes
- `ci` - CI/CD changes

**Scopes:**
- `api` - Backend API
- `web` - Frontend Web
- `types` - Types package
- `config` - Config package
- `validators` - Validators package
- `deps` - Dependencies
- `db` - Database

**Examples:**
```bash
git commit -m "feat(api): add vessel request approval endpoint"
git commit -m "fix(web): resolve token expiration handling"
git commit -m "docs(readme): update development setup instructions"
git commit -m "refactor(validators): extract common pagination schema"
git commit -m "chore(deps): update Prisma to v7.3.1"
```

---

## Working with Packages

### Creating a New Package

**Step 1: Create Package Directory**
```bash
mkdir packages/new-package
mkdir packages/new-package/src
```

**Step 2: Create package.json**
```json
{
  "name": "@procurement/new-package",
  "version": "1.0.0",
  "description": "Package description",
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
    "dev": "tsc --watch",
    "lint": "eslint src/"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

**Step 3: Create tsconfig.json**
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

**Step 4: Create src/index.ts**
```typescript
export * from './module.js';
```

**Step 5: Install and Build**
```bash
npm install  # From root
cd packages/new-package
npm run build
```

### Using Packages in Apps

**Add to App Dependencies:**
```bash
# In apps/api/package.json or apps/web/package.json
{
  "dependencies": {
    "@procurement/new-package": "workspace:*"
  }
}

# Install
npm install  # From root
```

**Import in Code:**
```javascript
// ESM
import { something } from '@procurement/new-package';

// Or specific exports
import { Something } from '@procurement/new-package/module.js';
```

### Updating Package Types

**Workflow:**
1. Edit type definition in `packages/types/src/*.ts`
2. Save (watch mode auto-rebuilds)
3. Apps detect change and rebuild
4. New types available in API and Web

**Example:**
```typescript
// packages/types/src/vessel.ts

// Add new field
export interface Vessel {
  id: string;
  vesselName: string;
  // ... existing fields
  classification?: string; // New field
}
```

```javascript
// apps/api/src/modules/vessels/vessel.controller.js

/**
 * @type {import('@procurement/types').Vessel}
 */
const vessel = {
  id: '...',
  vesselName: '...',
  classification: 'Tanker', // Now available with IntelliSense
};
```

---

## API Development

### Module Structure

Each API module follows this pattern:
```
modules/{feature}/
├── {feature}.controller.js     # Request handlers
├── {feature}.repository.js     # Database operations
├── {feature}.routes.js         # Route definitions
├── {feature}.validation.js     # Validation schemas
└── {feature}.middleware.js     # Optional middleware
```

### Creating a New Module

**Step 1: Create Module Directory**
```bash
cd apps/api/src/modules
mkdir purchase-order
```

**Step 2: Create Repository** (`purchase-order.repository.js`)
```javascript
import prisma from '#config/prisma.js';

export const findAll = async ({ page, limit, search }) => {
  const skip = (page - 1) * limit;
  
  const where = search ? {
    OR: [
      { poNumber: { contains: search } },
      { vendorName: { contains: search } },
    ],
  } : {};
  
  const [data, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);
  
  return { data, total };
};

export const findById = async (id) => {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  });
};

export const create = async (data) => {
  return prisma.purchaseOrder.create({
    data,
    include: { items: true },
  });
};

export const update = async (id, data) => {
  return prisma.purchaseOrder.update({
    where: { id },
    data,
  });
};

export const remove = async (id) => {
  return prisma.purchaseOrder.delete({
    where: { id },
  });
};
```

**Step 3: Create Controller** (`purchase-order.controller.js`)
```javascript
import * as repository from './purchase-order.repository.js';
import asyncHandler from '#shared/utils/asyncHandler.js';
import { AppError } from '#shared/utils/error.js';
import { successResponse } from '#shared/utils/response.js';
import { paginate } from '#shared/utils/paginate.js';

export const getAll = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  
  const { data, total } = await repository.findAll({ page, limit, search });
  
  const pagination = paginate(total, page, limit);
  
  res.json(successResponse(data, 'Purchase orders retrieved successfully', pagination));
});

export const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const po = await repository.findById(id);
  
  if (!po) {
    throw new AppError('Purchase order not found', 404);
  }
  
  res.json(successResponse(po, 'Purchase order retrieved successfully'));
});

export const create = asyncHandler(async (req, res) => {
  const data = req.body;
  
  const po = await repository.create(data);
  
  res.status(201).json(successResponse(po, 'Purchase order created successfully'));
});

export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  
  const po = await repository.update(id, data);
  
  res.json(successResponse(po, 'Purchase order updated successfully'));
});

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await repository.remove(id);
  
  res.json(successResponse(null, 'Purchase order deleted successfully'));
});
```

**Step 4: Create Validation** (`purchase-order.validation.js`)
```javascript
import { z } from 'zod';

export const createPOSchema = z.object({
  body: z.object({
    vendorId: z.string().uuid(),
    poNumber: z.string().min(1),
    poDate: z.date().or(z.string().datetime()),
    deliveryDate: z.date().or(z.string().datetime()).optional(),
    items: z.array(
      z.object({
        itemId: z.string().uuid(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
      })
    ).min(1),
  }),
});

export const updatePOSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    vendorId: z.string().uuid().optional(),
    poNumber: z.string().min(1).optional(),
    deliveryDate: z.date().or(z.string().datetime()).optional(),
  }),
});
```

**Step 5: Create Routes** (`purchase-order.routes.js`)
```javascript
import express from 'express';
import * as controller from './purchase-order.controller.js';
import validate from '#shared/middlewares/validate.js';
import * as validation from './purchase-order.validation.js';
import { authenticate } from '#modules/auth/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);
router.post('/', authenticate, validate(validation.createPOSchema), controller.create);
router.put('/:id', authenticate, validate(validation.updatePOSchema), controller.update);
router.delete('/:id', authenticate, controller.remove);

export default router;
```

**Step 6: Register Routes** (`apps/api/src/routes/index.js`)
```javascript
import express from 'express';
import purchaseOrderRoutes from '#modules/purchase-order/purchase-order.routes.js';

const router = express.Router();

// ... existing routes

router.use('/purchase-orders', purchaseOrderRoutes);

export default router;
```

### API Testing

**Manual Testing with curl:**
```bash
# Get token
TOKEN=$(curl -s http://localhost:3000/api/token \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"dev-machine"}' | jq -r '.data.token')

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"username":"admin","password":"password"}'

# Get purchase orders
curl http://localhost:3000/api/purchase-orders \
  -H "Authorization: Bearer $TOKEN"

# Create purchase order
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"vendorId":"...","poNumber":"PO-001","items":[...]}'
```

**Testing with Postman/Insomnia:**
1. Create collection for Procurement API
2. Set environment variables: `BASE_URL`, `TOKEN`
3. Create requests for each endpoint
4. Use pre-request scripts to generate token

---

## Frontend Development

### Feature Structure

Each feature follows this pattern:
```
features/{feature}/
├── api.js              # API calls for this feature
├── routes.js           # Vue Router routes
├── store.js            # Pinia state management
├── views/              # Page components
│   └── Index.vue
└── component/          # Feature-specific components
    └── FormComponent.vue
```

### Creating a New Feature

**Step 1: Create Feature Directory**
```bash
cd apps/web/src/features
mkdir purchase-order
mkdir purchase-order/views
mkdir purchase-order/component
```

**Step 2: Create API Module** (`api.js`)
```javascript
import http from '@/services/http';
import { PURCHASE_ORDER_ROUTES } from '@procurement/config';

export const getPurchaseOrders = (params) => {
  return http.get(PURCHASE_ORDER_ROUTES.LIST, { params });
};

export const getPurchaseOrder = (id) => {
  return http.get(PURCHASE_ORDER_ROUTES.GET(id));
};

export const createPurchaseOrder = (data) => {
  return http.post(PURCHASE_ORDER_ROUTES.CREATE, data);
};

export const updatePurchaseOrder = (id, data) => {
  return http.put(PURCHASE_ORDER_ROUTES.UPDATE(id), data);
};

export const deletePurchaseOrder = (id) => {
  return http.delete(PURCHASE_ORDER_ROUTES.DELETE(id));
};
```

**Step 3: Create Store** (`store.js`)
```javascript
import { defineStore } from 'pinia';
import * as api from './api';

export const usePurchaseOrderStore = defineStore('purchaseOrder', {
  state: () => ({
    purchaseOrders: [],
    currentPO: null,
    loading: false,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
    },
  }),
  
  actions: {
    async fetchPurchaseOrders(params = {}) {
      this.loading = true;
      try {
        const response = await api.getPurchaseOrders({
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...params,
        });
        this.purchaseOrders = response.data.data;
        this.pagination = response.data.pagination;
      } catch (error) {
        console.error('Failed to fetch purchase orders:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async fetchPurchaseOrder(id) {
      this.loading = true;
      try {
        const response = await api.getPurchaseOrder(id);
        this.currentPO = response.data.data;
      } catch (error) {
        console.error('Failed to fetch purchase order:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async createPurchaseOrder(data) {
      this.loading = true;
      try {
        const response = await api.createPurchaseOrder(data);
        await this.fetchPurchaseOrders();
        return response.data.data;
      } catch (error) {
        console.error('Failed to create purchase order:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async updatePurchaseOrder(id, data) {
      this.loading = true;
      try {
        const response = await api.updatePurchaseOrder(id, data);
        await this.fetchPurchaseOrders();
        return response.data.data;
      } catch (error) {
        console.error('Failed to update purchase order:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async deletePurchaseOrder(id) {
      this.loading = true;
      try {
        await api.deletePurchaseOrder(id);
        await this.fetchPurchaseOrders();
      } catch (error) {
        console.error('Failed to delete purchase order:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
```

**Step 4: Create View Component** (`views/Index.vue`)
```vue
<template>
  <div class="purchase-orders">
    <div class="header">
      <h1>Purchase Orders</h1>
      <Button @click="openCreateDialog">Create PO</Button>
    </div>
    
    <DataTable
      :value="poStore.purchaseOrders"
      :loading="poStore.loading"
      :pagination="poStore.pagination"
      @page-change="onPageChange"
    >
      <Column field="poNumber" header="PO Number" />
      <Column field="vendorName" header="Vendor" />
      <Column field="poDate" header="Date" />
      <Column field="total" header="Total" />
      <Column header="Actions">
        <template #body="{ data }">
          <Button @click="edit(data)">Edit</Button>
          <Button @click="remove(data)">Delete</Button>
        </template>
      </Column>
    </DataTable>
    
    <Dialog v-model:visible="showDialog">
      <FormPurchaseOrder
        :data="selectedPO"
        @submit="handleSubmit"
        @cancel="closeDialog"
      />
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePurchaseOrderStore } from '../store';
import DataTable from '@/components/base/data-table/DataTable.vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Column from 'primevue/column';
import FormPurchaseOrder from '../component/FormPurchaseOrder.vue';

const poStore = usePurchaseOrderStore();
const showDialog = ref(false);
const selectedPO = ref(null);

onMounted(() => {
  poStore.fetchPurchaseOrders();
});

const onPageChange = (page) => {
  poStore.pagination.page = page;
  poStore.fetchPurchaseOrders();
};

const openCreateDialog = () => {
  selectedPO.value = null;
  showDialog.value = true;
};

const edit = (po) => {
  selectedPO.value = po;
  showDialog.value = true;
};

const remove = async (po) => {
  if (confirm(`Delete PO ${po.poNumber}?`)) {
    await poStore.deletePurchaseOrder(po.id);
  }
};

const handleSubmit = async (data) => {
  if (selectedPO.value) {
    await poStore.updatePurchaseOrder(selectedPO.value.id, data);
  } else {
    await poStore.createPurchaseOrder(data);
  }
  closeDialog();
};

const closeDialog = () => {
  showDialog.value = false;
  selectedPO.value = null;
};
</script>

<style scoped>
.purchase-orders {
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
</style>
```

**Step 5: Create Routes** (`routes.js`)
```javascript
export default [
  {
    path: '/purchase-orders',
    name: 'PurchaseOrders',
    component: () => import('./views/Index.vue'),
    meta: {
      requiresAuth: true,
      title: 'Purchase Orders',
    },
  },
];
```

**Step 6: Register Routes** (`apps/web/src/app/router.js`)
```javascript
import purchaseOrderRoutes from '@/features/purchase-order/routes';

// ... existing route imports

const routes = [
  // ... existing routes
  ...purchaseOrderRoutes,
];
```

---

## Database Management

### Prisma Workflow

**Location:** `apps/api/prisma/schema.prisma`

### Schema Changes

**Step 1: Edit Schema**
```prisma
// apps/api/prisma/schema.prisma

model PurchaseOrder {
  id           String   @id @default(uuid())
  poNumber     String   @unique
  vendorId     String
  poDate       DateTime
  deliveryDate DateTime?
  status       OrderStatus @default(DRAFT)
  total        Decimal  @db.Decimal(15, 2)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  vendor Vendor @relation(fields: [vendorId], references: [id])
  items  PurchaseOrderItem[]
  
  @@map("purchase_orders")
}

enum OrderStatus {
  DRAFT
  SUBMITTED
  APPROVED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

**Step 2: Create Migration**
```bash
cd apps/api
npx prisma migrate dev --name add_purchase_order_model

# This will:
# 1. Create migration file in prisma/migrations/
# 2. Apply migration to database
# 3. Regenerate Prisma Client
```

**Step 3: Review Migration**
```bash
cat prisma/migrations/<timestamp>_add_purchase_order_model/migration.sql

# Should show:
# CREATE TABLE purchase_orders ...
# CREATE TYPE OrderStatus ...
```

**Step 4: Commit Migration**
```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add purchase order model"
```

### Common Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name <migration_name>

# Apply pending migrations (production)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Create migration without applying (preview)
npx prisma migrate dev --create-only

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

### Database Seeding

**Create Seed File:** `apps/api/prisma/seed.js`
```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: '$2b$10$...', // bcrypt hash
      name: 'Administrator',
      email: 'admin@example.com',
      phone: '1234567890',
      userType: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  
  console.log('Created admin:', admin);
  
  // Create sample vessels
  const vessels = await Promise.all([
    prisma.vessel.create({
      data: {
        vesselName: 'MV Ocean Star',
        vesselType: 'Container',
        flag: 'Singapore',
        imo: 'IMO1234567',
        status: 'ACTIVE',
      },
    }),
    prisma.vessel.create({
      data: {
        vesselName: 'MV Pacific Wind',
        vesselType: 'Tanker',
        flag: 'Panama',
        imo: 'IMO7654321',
        status: 'ACTIVE',
      },
    }),
  ]);
  
  console.log('Created vessels:', vessels);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Add to package.json:**
```json
{
  "prisma": {
    "seed": "node prisma/seed.js"
  }
}
```

**Run Seed:**
```bash
cd apps/api
npx prisma db seed
```

---

## Testing

### Unit Testing (Future)

**Framework:** Vitest

**Structure:**
```
apps/api/src/modules/auth/
├── auth.controller.js
├── auth.controller.test.js
├── auth.repository.js
└── auth.repository.test.js
```

**Example Test:**
```javascript
// auth.controller.test.js
import { describe, it, expect, vi } from 'vitest';
import * as controller from './auth.controller.js';
import * as repository from './auth.repository.js';

vi.mock('./auth.repository.js');

describe('Auth Controller', () => {
  it('should login successfully with valid credentials', async () => {
    const req = {
      body: { username: 'admin', password: 'password' },
    };
    const res = {
      json: vi.fn(),
    };
    
    repository.findUser.mockResolvedValue({
      id: '1',
      username: 'admin',
      password: '$2b$10$...',
    });
    
    await controller.login(req, res);
    
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.any(Object),
          token: expect.any(String),
        }),
      })
    );
  });
});
```

### Integration Testing (Future)

**Framework:** Vitest + Supertest

**Example:**
```javascript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app.js';

describe('Vessel API', () => {
  it('GET /api/vessels should return vessels', async () => {
    const response = await request(app)
      .get('/api/vessels')
      .set('Authorization', 'Bearer <token>')
      .expect(200);
    
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
```

### E2E Testing (Future)

**Framework:** Playwright

**Example:**
```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

---

## Debugging

### API Debugging

**VS Code Launch Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/apps/api/src/server.js",
      "cwd": "${workspaceFolder}/apps/api",
      "envFile": "${workspaceFolder}/apps/api/.env",
      "console": "integratedTerminal"
    }
  ]
}
```

**Debugging Steps:**
1. Set breakpoints in VS Code
2. Press F5 or click "Debug API"
3. Make API request
4. Inspect variables, step through code

**Console Logging:**
```javascript
import logger from '#config/logger.js';

// Use Pino logger (structured logging)
logger.info('User login attempt', { username: 'admin' });
logger.error('Database error', { error: error.message });
logger.debug('Query params', { params: req.query });
```

### Frontend Debugging

**Vue DevTools:**
1. Install Vue DevTools browser extension
2. Open DevTools (F12)
3. Click "Vue" tab
4. Inspect components, state, events

**Browser DevTools:**
- **Network Tab:** Monitor API requests/responses
- **Console Tab:** View logs and errors
- **Sources Tab:** Set breakpoints in source code
- **Application Tab:** Inspect localStorage, cookies

**Debugging in VS Code:**
```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug Web",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/apps/web/src"
}
```

---

## Code Style Guide

### JavaScript/TypeScript

**Follow Prettier Configuration:**
- Semi-colons: Yes
- Single quotes: Yes
- Tab width: 2 spaces
- Max line length: 100 characters
- Trailing commas: es5
- Arrow function parens: always

**Naming Conventions:**
- **Files/Folders:** kebab-case (`vessel-request.controller.js`)
- **Variables/Functions:** camelCase (`getUserById`)
- **Classes:** PascalCase (`AppError`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Private fields:** Leading underscore (`_privateMethod`)

**Import Organization:**
```javascript
// 1. Node built-ins
import fs from 'fs';
import path from 'path';

// 2. External packages
import express from 'express';
import { z } from 'zod';

// 3. Internal packages
import { User } from '@procurement/types';
import { loginSchema } from '@procurement/validators';

// 4. Internal modules (subpath imports)
import logger from '#config/logger.js';
import asyncHandler from '#shared/utils/asyncHandler.js';

// 5. Relative imports
import * as repository from './vessel.repository.js';
import { formatDate } from './utils.js';
```

**Function Documentation:**
```javascript
/**
 * Get vessel by ID
 * @param {string} id - Vessel UUID
 * @returns {Promise<Vessel>} Vessel object
 * @throws {AppError} If vessel not found
 */
export const getVesselById = async (id) => {
  const vessel = await repository.findById(id);
  if (!vessel) {
    throw new AppError('Vessel not found', 404);
  }
  return vessel;
};
```

### Vue/Template

**Component Naming:**
- **File names:** PascalCase (`FormVessel.vue`)
- **Component usage:** PascalCase (`<FormVessel />`)

**Script Setup Style:**
```vue
<script setup>
// 1. Imports
import { ref, computed, onMounted } from 'vue';
import { useVesselStore } from '../store';

// 2. Props
const props = defineProps({
  vesselId: {
    type: String,
    required: true,
  },
});

// 3. Emits
const emit = defineEmits(['submit', 'cancel']);

// 4. Composables/Stores
const vesselStore = useVesselStore();

// 5. Reactive state
const loading = ref(false);
const formData = ref({});

// 6. Computed
const isValid = computed(() => {
  return formData.value.name && formData.value.type;
});

// 7. Methods
const handleSubmit = () => {
  emit('submit', formData.value);
};

// 8. Lifecycle
onMounted(async () => {
  await vesselStore.fetchVessel(props.vesselId);
});
</script>
```

**Template Style:**
```vue
<template>
  <div class="form-vessel">
    <!-- Use v-show for toggle, v-if for conditional rendering -->
    <form v-if="!loading" @submit.prevent="handleSubmit">
      <!-- Bind props with :prop-name -->
      <InputText
        v-model="formData.name"
        :disabled="loading"
        placeholder="Vessel Name"
      />
      
      <!-- Event handlers with @event-name -->
      <Button
        type="submit"
        :disabled="!isValid"
        @click="handleSubmit"
      >
        Submit
      </Button>
    </form>
    
    <!-- Loading state -->
    <div v-else class="loading">
      <ProgressSpinner />
    </div>
  </div>
</template>
```

---

## Common Tasks

### Add New Database Field

```bash
# 1. Edit schema
cd apps/api
vim prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name add_field_to_vessel

# 3. Update types (if using TypeScript)
cd ../../packages/types
vim src/vessel.ts

# 4. Build packages
npm run build

# 5. Update API/Web code to use new field
```

### Add New API Endpoint

```bash
# 1. Add controller method
vim apps/api/src/modules/vessel/vessel.controller.js

# 2. Add repository method
vim apps/api/src/modules/vessel/vessel.repository.js

# 3. Add validation schema
vim apps/api/src/modules/vessel/vessel.validation.js

# 4. Add route
vim apps/api/src/modules/vessel/vessel.routes.js

# 5. Test endpoint
curl http://localhost:3000/api/vessels/<endpoint>
```

### Add New Page

```bash
# 1. Create view component
vim apps/web/src/features/vessel/views/NewPage.vue

# 2. Add route
vim apps/web/src/features/vessel/routes.js

# 3. Add navigation link (if needed)
vim apps/web/src/components/layout/Sidebar.vue

# 4. Test in browser
open http://localhost:5173/vessels/new-page
```

### Update Shared Type

```bash
# 1. Edit type
vim packages/types/src/vessel.ts

# 2. Rebuild package
cd packages/types
npm run build

# 3. Use in API/Web
# Types auto-update via workspace linking
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
# Linux/macOS
lsof -i :3000
lsof -i :5173

# Windows (PowerShell)
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Kill process
kill -9 <PID>
# or Windows
taskkill /PID <PID> /F
```

### Database Connection Error

```bash
# Check MySQL running
# macOS
brew services list

# Linux
sudo systemctl status mysql

# Windows
services.msc  # Find MySQL service

# Test connection
mysql -u procurement_user -p procurement

# Check .env DATABASE_URL
cat apps/api/.env | grep DATABASE_URL
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
npm install

# Clear Turborepo cache
rm -rf .turbo
rm -rf apps/*/.turbo
rm -rf packages/*/.turbo

# Rebuild packages
npm run build
```

### Prisma Client Not Generated

```bash
cd apps/api
npx prisma generate
```

### Vite Build Fails

```bash
cd apps/web
rm -rf node_modules dist
npm install
npm run build
```

---

## Additional Resources

- **Turborepo Docs:** https://turbo.build/repo/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Vue 3 Docs:** https://vuejs.org/
- **Vite Docs:** https://vitejs.dev/
- **PrimeVue Docs:** https://primevue.org/
- **Express Docs:** https://expressjs.com/
- **Zod Docs:** https://zod.dev/

---

**Need Help?** Contact the development team or refer to [MONOREPO-MIGRATION.md](./MONOREPO-MIGRATION.md) for architecture details.
