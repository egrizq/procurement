# Vessel Request Module - Implementation Guide

**Module Name:** Vessel Request  
**Status:** ✅ Complete (with ongoing improvements)  
**Created:** February 2026  
**Last Updated:** May 2026  
**Version:** 2.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Data Flow](#data-flow)
6. [Development Journey](#development-journey)
7. [Best Practices](#best-practices)
8. [Testing Guide](#testing-guide)
9. [Future Enhancements](#future-enhancements)

---

## Overview

### Purpose

The Vessel Request module enables users to create and manage procurement requests for vessel supplies. Each request contains header information (vessel, date, priority, justification) and multiple line items with specific quantities and requirements.

### Key Features

- ✅ Multi-step wizard form for complex data entry
- ✅ Dynamic items management (add/remove items)
- ✅ Duplicate item detection before submit
- ✅ Server-side pre-submission validation endpoint (`/validate`)
- ✅ Validation warnings dialog (intercepts form before submit)
- ✅ Server-side pagination for request list
- ✅ Real-time search functionality (by request code)
- ✅ Status filter support (`status` param on list endpoint)
- ✅ Read-only view mode with beautiful UI
- ✅ Row-click navigation for viewing details
- ✅ Status and priority badges with color coding
- ✅ Integration with master data (vessels, items, vessel stocks, vessel standards)
- ✅ Rich server-side validation (inactive items, stock checks, frequency, capacity)
- ✅ Staff review workflow (Approve / Reject with adjustments)
- ✅ PDF generation (full request & per-item PDF download)
- ✅ Responsive design with Tailwind CSS

### Statuses

| Status | Description |
|--------|-------------|
| `Waiting` | Request created with warnings; needs staff review |
| `Approved by system` | Request auto-approved (no warnings detected) |
| `Approved` | Staff manually approved |
| `Rejected` | Staff rejected with reason |

### User Flow

```
1. User clicks "New Request" button
2. Step 1: Select vessel, date, priority, justification
3. Step 2: Add items with quantities, units, priorities
4. Submit → Frontend calls /validate first
   ├─ If warnings → Show validation dialog
   │   ├─ User clicks "Go Back & Edit" → stays on form
   │   └─ User clicks "Tetap Ajukan Request" → proceed to create
   └─ If no warnings → Directly proceed to create
5. Backend creates request with status: "Approved by system" (clean) or "Waiting" (warnings)
6. User can click any row to view full details
7. Staff sees "Staff Actions" panel on Waiting requests (Approve/Reject with optional item qty adjustment)
8. Approved requests show PDF download buttons (full or per-item)
```

---

## Architecture

### Technology Stack

**Backend:**
- Express.js (REST API)
- Drizzle ORM (MySQL)
- Zod (Validation)
- TypeScript
- pdfmake (PDF generation)

**Frontend:**
- Vue 3 (Composition API, `<script setup>`)
- Pinia (State Management)
- Vite (Build Tool)
- Tailwind CSS (Styling)
- Lucide Vue Next (UI Icons)
- SweetAlert2 (Confirmation dialogs)

**Shared:**
- Monorepo structure with Turborepo
- Shared validators package
- Shared types package

### Module Structure

```
Backend (apps/api):
├── src/modules/vessel-request/
│   ├── vessel-request.controller.ts    # Request handlers (create, getAll, getById, update, validate, review, generatePdf)
│   ├── vessel-request.repository.ts    # Database operations (Drizzle ORM)
│   ├── vessel-request.routes.ts        # Route definitions
│   ├── vessel-request.validation.ts    # Zod schema imports
│   └── vessel-request.pdf.ts           # PDF generation with pdfmake

├── src/db/schema/
│   ├── vessel-requests.ts              # Drizzle table definitions
│   └── enums.ts                        # Shared enum values

Frontend (apps/web):
├── src/features/request/
│   ├── views/
│   │   └── Index.vue                   # Main list view + validation warnings dialog
│   ├── component/
│   │   ├── FormRequest.vue             # Multi-step create/edit form
│   │   └── ViewRequest.vue             # Read-only view + staff review + PDF download
│   ├── store.js                        # Pinia store (fetch, validate, create, review, downloadPdf)
│   └── api.js                          # HTTP service layer

Shared (packages):
└── validators/src/
    └── vessel-request.js               # Zod schemas
```

---

## Backend Implementation

### 1. Database Schema (Drizzle)

**Location:** `apps/api/src/db/schema/vessel-requests.ts`

```typescript
// vessel_requests table
export const vesselRequests = mysqlTable('vessel_requests', {
  id: int('id').primaryKey().autoincrement(),
  requestCode: varchar('request_code', { length: 100 }).notNull(),
  requestedBy: int('requested_by').notNull().references(() => users.id),
  vesselId: int('vessel_id').notNull().references(() => mstVessels.id),
  status: mysqlEnum('status', requestStatusEnum).default('Waiting').notNull(),
  priority: mysqlEnum('priority', priorityEnum).default('Medium').notNull(),
  justification: text('justification'),
  requestDate: date('request_date', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: int('reviewed_by').references(() => users.id),
  rejectReason: text('reject_reason'),
});

// vessel_request_items table
export const vesselRequestItems = mysqlTable('vessel_request_items', {
  id: int('id').primaryKey().autoincrement(),
  vesselRequestId: int('vessel_request_id').notNull().references(() => vesselRequests.id),
  itemId: int('item_id').notNull().references(() => mstItems.id),
  qtyRequested: int('qty_requested').notNull(),
  qtyApproved: int('qty_approved'),
  unit: mysqlEnum('unit', unitEnum).notNull(),
  status: mysqlEnum('status', requestStatusEnum).default('Waiting').notNull(),
  priority: mysqlEnum('priority', priorityEnum).default('Medium').notNull(),
  justification: text('justification'),
  staffJustification: text('staff_justification'),  // ← Added for staff review adjustments
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});
```

**Enums used:**

```typescript
// enums.ts
export const requestStatusEnum = ['Approved by system', 'Waiting', 'Approved', 'Rejected'] as const;
export const priorityEnum       = ['Low', 'Medium', 'High'] as const;
export const unitEnum           = ['Pcs', 'Box', 'Liter', 'Meter', 'Kg'] as const;
```

> **Note:** Schema uses Drizzle ORM with MySQL (not Prisma as originally planned). Status `"Ok"` from early docs was replaced by `"Approved by system"`.

### 2. Validation Schema (Zod)

**Location:** `packages/validators/src/vessel-request.js`

Zod schemas are imported in `vessel-request.validation.ts` and used by validation middleware. Key schemas:
- `vesselRequestSchema` – for create
- `vesselRequestListSchema` – for list (supports `page`, `limit`, `search`, `status`)
- `vesselRequestByIdSchema` – for single fetch by ID (params)
- `updateVesselRequestSchema` – for update
- `reviewVesselRequestSchema` – for staff review (approve/reject)

### 3. Repository Pattern

**Location:** `apps/api/src/modules/vessel-request/vessel-request.repository.ts`

**Key Methods:**

```typescript
class VesselRequestRepository {
  // Create vessel request header
  async createVesselRequest(data: any): Promise<VesselRequest>

  // Create request items in bulk
  async createVesselRequestItems(data: any[]): Promise<{ count: number }>

  // Get paginated list with optional search and status filter
  async getVesselRequests(page: number, limit: number, search: string, status?: string)
  // Returns: { items, total }
  // items include _count.vesselRequestItems and availableForMocCount

  // Get single request with all items
  async getVesselRequestById(id: number)
  // Returns: { ...request, vesselRequestItems: items }

  // Smart validation helpers
  async findRecentRequestedItems(vesselId, itemIds, days = 30)
  async getVesselItemStandards(vesselId, itemIds)
  async getVesselStocks(vesselId, itemIds)

  // Staff review: approve or reject
  async reviewRequest(id, userId, action, rejectReason?, itemsAdjustment?)
  // Uses DB transaction: updates header status + all item statuses + qty adjustments
}
```

**Design Decisions:**
- ✅ Drizzle ORM with raw SQL query builder (not Prisma)
- ✅ `availableForMocCount` computed per request: items that are approved AND not yet assigned to any MOC
- ✅ Transactions used for multi-table operations (review)
- ✅ Status filter supports `'Approved'` which matches both `'Approved'` and `'Approved by system'`

### 4. Controller Logic

**Location:** `apps/api/src/modules/vessel-request/vessel-request.controller.ts`

**Validation Logic (`validateVesselRequestPayload`):**

```typescript
const validateVesselRequestPayload = async (body) => {
  // 1. Vessel must exist
  const vessel = await mstVesselRepo.findVessel({ id: body.vesselId });
  if (!vessel) throw new AppError('Vessel is not found!', 400);

  // 2. All items must exist
  const items = await mstItemRepo.findItemByIds(itemIds);
  if (items.length !== requestItems.length) throw new AppError('One or more items are invalid!', 400);

  // 3. Items must be active (status === 'Publish')
  const inactiveItems = items.filter(item => item.status !== 'Publish');
  if (inactiveItems.length > 0) throw new AppError(`Cannot request inactive items: ${names}`, 400);

  // 4. Load parallel: recent history, vessel standards, vessel stocks
  const [historyList, standardsList, stocksList] = await Promise.all([
    findRecentRequestedItems(vesselId, itemIds, 30),
    getVesselItemStandards(vesselId, itemIds),
    getVesselStocks(vesselId, itemIds),
  ]);

  // 5. Per-item warning generation
  const validations = requestItems.map(reqItem => {
    const warnings = [];

    // Warning: Item requested in last 30 days
    if (history?.length > 0) {
      warnings.push(`Item ini baru saja diajukan pada request ${mostRecent.requestCode} tanggal ${dateStr}.`);
    }

    // Warning: Item not in vessel's standard list
    if (!standard) {
      warnings.push(`Item tidak terdaftar pada standard kapal ini.`);
    } else {
      // Warning: Exceeds max stock capacity
      if (reqItem.qtyRequested + stockOnHand > standard.maxStock) {
        warnings.push(`Request melebihi kapasitas standar simpan batas maksimum (${standard.maxStock}).`);
      }
    }

    // Warning: High priority but stock is above min
    if (reqItem.priority === 'High' && stock?.stockOnHand > standard?.minStock) {
      warnings.push(`Stok aktual (${stock.stockOnHand}) masih di atas batas minimal, disarankan Priority Medium/Low.`);
    }

    // Warning: Stock report outdated (>30 days)
    if (stock?.lastUpdate && diffDays > 30) {
      warnings.push(`Laporan stok terakhir diupdate pada ${dateStr} (Lebih dari 30 hari).`);
    }
    if (!stock) {
      warnings.push(`Belum ada data laporan stok untuk item ini pada kapal.`);
    }

    return { itemId, itemName, warnings };
  });

  return {
    items: validations,
    header: [],
    hasWarnings: validations.some(i => i.warnings.length > 0),
    status: hasWarnings ? 'Waiting' : 'Approved by system',
  };
};
```

**Create Flow:**
```typescript
const create = asyncHandler(async (req, res) => {
  // 1. Auth check
  const userId = req.apiToken!.userId;

  // 2. Validate date format
  const requestDate = new Date(req.body.requestDate);

  // 3. Run full validation (throws on hard errors, returns warnings)
  const validationResult = await validateVesselRequestPayload(req.body);

  // 4. Generate request code
  const requestCode = `VR-${Date.now()}`;

  // 5. Create header – status derived from validation
  const vesselRequest = await vesselRequestRepo.createVesselRequest({
    requestCode,
    user: { connect: { id: userId } },
    vessel: { connect: { id: req.body.vesselId } },
    status: validationResult.status, // 'Approved by system' or 'Waiting'
    priority: req.body.priority,
    justification: req.body.justification,
    requestDate,
  });

  // 6. Create items – each item's status derived individually from warnings
  const vesselRequestItemsData = req.body.items.map(item => {
    const status = (validationByItem.get(item.itemId)?.warnings.length ?? 0) > 0
      ? 'Waiting'
      : 'Approved by system';
    return {
      vesselRequestId: vesselRequest.id,
      itemId: item.itemId,
      qtyRequested: item.qtyRequested,
      qtyApproved: status === 'Approved by system' ? item.qtyRequested : null,
      unit: item.unit,
      status,
      priority: item.priority,
      justification: item.justification,
    };
  });

  return success(res, { vesselRequest, vesselRequestItems, validation: validationResult }, 201);
});
```

**Review Flow:**
```typescript
const review = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { action, rejectReason, itemsAdjustment } = req.body;

  // Only 'Waiting' requests can be reviewed
  if (vesselRequest.status !== 'Waiting') throw new AppError('Only Waiting requests can be reviewed', 400);

  // Calls reviewRequest which wraps in a DB transaction
  const updated = await vesselRequestRepo.reviewRequest(id, userId, action, rejectReason, itemsAdjustment);
  return success(res, updated, 200);
});
```

**PDF Generation:**
```typescript
const generatePdf = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const itemId = req.query.itemId ? Number(req.query.itemId) : undefined;

  // Filter to single item if itemId query param provided
  if (itemId !== undefined) {
    vesselRequest.vesselRequestItems = vesselRequest.vesselRequestItems.filter(i => i.id === itemId);
  }

  const pdfBuffer = await generateVesselRequestPdf(vesselRequest);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=VesselRequest-${vesselRequest.requestCode}${itemId ? '-item' : ''}.pdf`);
  res.send(pdfBuffer);
});
```

**Key Features:**
- ✅ Comprehensive validation before database operations
- ✅ Atomic transactions for review (header + all items updated together)
- ✅ Authentication check via API token middleware
- ✅ Auto-generated request code (`VR-<timestamp>`)
- ✅ Per-item `qtyApproved` auto-set on "Approved by system"
- ✅ PDF uses `pdfmake` with Helvetica (built-in font, no external files)

### 5. Routes Configuration

**Location:** `apps/api/src/modules/vessel-request/vessel-request.routes.ts`

```typescript
// All routes have apiAuth() middleware
router.post('/',             apiAuth(), validate(vesselRequestSchema),       controller.create);
router.post('/validate',     apiAuth(), validate(vesselRequestSchema),       controller.validate);
router.post('/list/:id',     apiAuth(), validate(vesselRequestByIdSchema),   controller.getById);
router.post('/list',         apiAuth(), validate(vesselRequestListSchema),   controller.getAll);
router.put('/:id',           apiAuth(), validate(updateVesselRequestSchema), controller.update);
router.post('/:id/review',   apiAuth(), validate(reviewVesselRequestSchema), controller.review);
router.get('/:id/pdf',       apiAuth(), validate(vesselRequestByIdSchema),   controller.generatePdf);
```

**Design Decisions:**
- ✅ `/validate` endpoint for pre-submission frontend validation (same schema as create)
- ✅ `POST /list` to support complex filter payloads (page, limit, search, status)
- ✅ `POST /list/:id` for single item (using POST for consistency)
- ✅ `POST /:id/review` for staff review workflow
- ✅ `GET /:id/pdf` with optional `?itemId=` query param for per-item PDF

---

## Frontend Implementation

### 1. Main List View

**Location:** `apps/web/src/features/request/views/Index.vue`

**Key Features:**
- Server-side pagination
- Real-time search with debouncing (500ms)
- Row-click navigation to view details
- Color-coded status and priority badges
- `formatStatus()` helper: displays `'Approved by system'` correctly
- Validation warnings intercept dialog (shown between form submit and actual create)

**Table Columns:**
```javascript
const columns = [
  { key: 'requestCode', label: 'Request Code' },
  { key: 'vessel.name', label: 'Vessel' },
  { key: 'user.fullName', label: 'Requested By' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'requestDate', label: 'Request Date' },
  { key: '_count.vesselRequestItems', label: 'Items' },
]
```

**Validation Warning Dialog Flow:**
```javascript
// handleFormSubmit is called when user clicks "Submit Request" in FormRequest
const handleFormSubmit = async (formData) => {
  // 1. Call /validate endpoint first
  const response = await requestStore.validateRequest(formData)

  const itemsWithWarnings = response.items.filter(i => i.warnings.length > 0)

  if (itemsWithWarnings.length > 0) {
    // 2. Show warning dialog - user can review or dismiss
    validationWarnings.value = itemsWithWarnings
    pendingFormData.value = formData
    isValidationOpen.value = true
  } else {
    // No warnings - proceed directly
    await proceedCreate(formData)
  }
}

// User confirms despite warnings
const confirmFormSubmit = async () => {
  isValidationOpen.value = false
  await proceedCreate(pendingFormData.value)
}
```

**Status Colors:**
```javascript
{
  'Approved by system': 'bg-green-100 text-green-800',
  Ok:        'bg-emerald-100 text-emerald-800',   // legacy, kept for compatibility
  Waiting:   'bg-yellow-100 text-yellow-800',
  Approved:  'bg-green-100 text-green-800',
  Rejected:  'bg-red-100 text-red-800',
  Pending:   'bg-blue-100 text-blue-800',
  Completed: 'bg-purple-100 text-purple-800',
}
```

### 2. Multi-Step Form Component

**Location:** `apps/web/src/features/request/component/FormRequest.vue`

**Design Pattern: Multi-Step Wizard (2 steps)**

**Step 1 – Request Info:**
- Vessel dropdown (shows name + IMO number)
- Request date (defaults to today)
- Priority (Low/Medium/High, default: Medium)
- Justification (optional textarea)

**Step 2 – Items:**
- 4-column grid: Item | Qty | Unit | Priority
- Full-width justification row per item
- Add Item / Remove Item (min 1 item enforced)
- Item dropdown shows: `name (itemCode) (id)`

**Validations:**
```javascript
// Step 1 → Step 2
if (!formData.value.vesselId || !formData.value.requestDate) {
  showError('Please fill in all required fields')
  return
}

// Step 2 submit
const hasInvalidItems = formData.value.items.some(item => !item.itemId || !item.qtyRequested || item.qtyRequested < 1)

// Duplicate item detection
const validItemIds = formData.value.items.filter(i => i.itemId).map(i => i.itemId)
const hasDuplicates = new Set(validItemIds).size !== validItemIds.length
if (hasDuplicates) {
  showError('Terdapat item duplikat di dalam request. Gabungkan qty jika item sama.')
  return
}
```

**Form State (hidden fields):**
```javascript
formData.value = {
  vesselId: null,
  status: 'Waiting',        // Hidden – server derives final status
  priority: 'Medium',
  justification: '',
  requestDate: new Date().toISOString().split('T')[0],
  items: [{
    itemId: null,
    qtyRequested: 1,
    unit: 'Pcs',
    status: 'Waiting',      // Hidden – server derives per-item status
    priority: 'Medium',
    justification: '',
  }],
}
```

**Footer Navigation:**
- Step 1: Cancel | Next
- Step 2: Previous | Cancel | Submit Request
- Submit disabled if `loading || formData.items.length === 0`

### 3. View/Review Component

**Location:** `apps/web/src/features/request/component/ViewRequest.vue`

**Design Pattern:** Full-screen FormDialog with:

1. **Gradient header card** (`bg-gradient-to-r from-indigo-50 to-blue-50`)
   - Request code + date
   - PDF download button (full request) – visible only if status is Approved/Approved by system
   - Status badge + Priority badge
   - Vessel info (with Ship icon)
   - Requester info (with User icon)
   - Justification (if present)

2. **Items DataTable** (no pagination, not clickable)
   - Columns: `#` | Item | Qty Requested | Qty Approved | Status | Priority | Actions
   - **Qty Approved column**: Shows inline +/- adjustment controls when `isAdjusting = true`
   - **Actions column**: Per-item PDF download button (only for Approved requests)

3. **Staff Actions Panel** (visible only when `request.status === 'Waiting'`)
   - Checkbox: "Adjust items before approving?"
   - Reject button → shows reject reason textarea
   - Approve button → submits review

**Staff Review State Machine:**
```javascript
const isAdjusting = ref(false)   // Enables per-item qty adjustment controls
const isRejecting = ref(false)   // Shows reject reason textarea
const rejectReason = ref('')
const adjustments = ref({})      // { [itemId]: { qtyApproved, staffJustification } }

const submitReview = async (action) => {
  const payload = { action }
  if (action === 'Reject') {
    payload.rejectReason = rejectReason.value
  } else if (action === 'Approve' && isAdjusting.value) {
    payload.itemsAdjustment = Object.entries(adjustments.value).map(([itemId, data]) => ({
      itemId: Number(itemId),
      qtyApproved: data.qtyApproved,
      staffJustification: data.staffJustification || undefined
    }))
  }
  await requestStore.reviewRequest(props.request.id, payload)
}
```

**PDF Download (in ViewRequest):**
```javascript
// Full request PDF
const downloadPDF = async () => {
  const blob = await requestStore.downloadPdf(props.request.id)
  // Creates blob URL → <a> click → revokes URL
}

// Per-item PDF
const downloadItemPDF = async (row) => {
  const blob = await requestStore.downloadPdf(props.request.id, row.id)
  // Same blob-to-download pattern
}
```

### 4. Pinia Store

**Location:** `apps/web/src/features/request/store.js`

```javascript
export const useRequestStore = defineStore('request', {
  state: () => ({
    requests: [],
    pagination: {},
    error: null,
  }),
  actions: {
    async fetchRequests(page, limit, search),        // Supports status param via API
    async fetchRequestById(id),                      // Returns request data directly
    async validateRequest(requestData),              // Calls /validate, returns { items, hasWarnings }
    async createRequest(requestData),
    async updateRequest(id, requestData),
    async reviewRequest(id, payload),                // { action, rejectReason?, itemsAdjustment? }
    async deleteRequest(id),
    async downloadPdf(id, itemId?),                  // Returns blob (responseType: 'blob')
    clearError(),
  },
})
```

### 5. API Service Layer

**Location:** `apps/web/src/features/request/api.js`

```javascript
export async function getRequests(page, limit, search, status)  // POST /vessel-requests/list
export async function getRequestsById(id)                        // POST /vessel-requests/list/:id
export async function createRequest(requestData)                 // POST /vessel-requests
export async function updateRequest(id, requestData)             // PUT /vessel-requests/:id
export async function deleteRequest(id)                          // DELETE /vessel-requests/:id
export async function validateRequestForm(requestData)           // POST /vessel-requests/validate
export async function reviewRequest(id, payload)                 // POST /vessel-requests/:id/review
export async function downloadRequestPdf(id, itemId?)            // GET /vessel-requests/:id/pdf?itemId=
// Note: downloadRequestPdf uses responseType: 'blob' for binary PDF data
```

---

## Data Flow

### Request Creation Flow (with Validation Dialog)

```
1. User fills form (Step 1 + Step 2)
   └─> FormRequest emits 'submit' event with formData

2. Index.vue: handleFormSubmit(formData)
   └─> Calls requestStore.validateRequest(formData)
   └─> POST /vessel-requests/validate

3. Backend runs full validation
   └─> Check vessel, items, inactive items, history, stocks, standards
   └─> Returns: { items: [{ itemId, itemName, warnings[] }], hasWarnings }

4a. If warnings exist:
    └─> Show Validation Warnings Dialog
    └─> User reviews item-by-item warnings
    ├─> "Go Back & Edit" → closes dialog, form stays open
    └─> "Tetap Ajukan Request" → calls proceedCreate(formData)

4b. If no warnings:
    └─> Directly calls proceedCreate(formData)

5. proceedCreate:
   └─> requestStore.createRequest(formData)
   └─> POST /vessel-requests

6. Backend creates request
   └─> Re-validates to get per-item statuses
   └─> Creates VesselRequest header
   └─> Creates VesselRequestItem records (with per-item status + qtyApproved)
   └─> Returns { vesselRequest, vesselRequestItems, validation }

7. Frontend response
   └─> showSuccess('Request created successfully')
   └─> closeForm()
   └─> fetchRequests() (refresh list)
```

### Staff Review Flow

```
1. Staff clicks "Waiting" request row
   └─> Fetches full request detail (POST /vessel-requests/list/:id)

2. ViewRequest shows Staff Actions panel
   ├─> Optional: check "Adjust items?" → shows +/- controls per item
   ├─> Reject: click "Reject..." → fill reason → Confirm Reject
   └─> Approve: click "Approve" (with optional itemsAdjustment)

3. POST /vessel-requests/:id/review
   Body: { action: 'Approve'|'Reject', rejectReason?, itemsAdjustment? }

4. Backend (transaction):
   └─> Update vesselRequests.status = 'Approved'|'Rejected'
   └─> Update vesselRequests.reviewedBy = userId
   └─> Update vesselRequests.reviewedAt = NOW()
   └─> For each item:
       ├─> Approve: qtyApproved = qtyRequested (or adjusted value)
       └─> Reject: qtyApproved = 0, status = 'Rejected'

5. Frontend:
   └─> showSuccess('Request successfully approved/rejected')
   └─> emit('reviewed') → Index.vue calls fetchRequests()
   └─> Close dialog
```

### PDF Download Flow

```
1. User (Approved request) clicks PDF button in ViewRequest
2. requestStore.downloadPdf(requestId, itemId?)
3. GET /vessel-requests/:id/pdf?itemId=<n>   (itemId is optional)
4. Backend:
   └─> Fetch full request with items
   └─> Filter to single item if itemId provided
   └─> generateVesselRequestPdf(request) with pdfmake
   └─> res.send(pdfBuffer) with Content-Type: application/pdf
5. Frontend:
   └─> Creates Blob URL
   └─> Simulates link click to download
   └─> Revokes URL
```

---

## Development Journey

### v1.0 – Initial Implementation

**Goal:** Create a functional vessel request form

**Challenges:**
1. Too many fields for single page
2. Complex nested data structure (header + items)
3. Need to validate both levels

**Solution:** Multi-step wizard approach
- Step 1: Header information
- Step 2: Dynamic items array

### v1.1 – Form Refinements

**Changes:**
- Status hidden from UI (server derives it)
- Compact 4-column grid for items
- Item status removed from UI

### v1.2 – View Separation

**Changes:**
1. Removed actions column from table
2. Created separate `ViewRequest.vue` component
3. Made entire table row clickable
4. DataTable enhanced with `row-click` event

### v1.3 – Visual Polish

**Changes:**
1. Added Lucide Vue Next icons (Ship, User, Package, Loader2)
2. Changed items display from cards to DataTable
3. Enhanced header with gradient (`from-indigo-50 to-blue-50`)

### v1.4 – DataTable Integration

**Changes:**
- Replaced custom HTML table with reusable `DataTable` component
- Added `clickable` prop to DataTable
- Consistent cell slot pattern everywhere

### v2.0 – Advanced Validation, Review & PDF

**Changes:**
1. **Server-side validation engine** with 4 warning categories:
   - Recent request history (30-day window)
   - Item not in vessel standards
   - Max stock capacity exceeded
   - High priority with sufficient stock
   - Stale stock report (>30 days)
2. **`/validate` endpoint** – pre-submission check without creating the record
3. **Validation warnings dialog** in `Index.vue` with "Tetap Ajukan" confirm
4. **Staff review workflow** (`POST /:id/review`) with Approve/Reject + optional item qty adjustment
5. **`staffJustification` field** per item for staff-adjusted quantities
6. **PDF generation** with pdfmake (full request + per-item)
7. **`availableForMocCount`** – smart counter for MOC eligibility
8. **Status filter** on list endpoint
9. **Duplicate item detection** in form submit
10. **Inactive item check** (must be `status === 'Publish'`)

---

## Best Practices

### 1. Form Design

**✅ DO:**
- Use multi-step wizards for complex forms (>6 fields)
- Provide sensible defaults (dates, priorities)
- Hide technical fields from users (status management)
- Validate at each step, not just at submit
- Show clear error messages
- Pre-validate server-side before actual create (two-phase submit)
- Detect and block duplicate items before submission
- Enable/disable buttons based on state

**❌ DON'T:**
- Put everything on one page
- Use ambiguous labels
- Allow removing the last item
- Submit without validation
- Ignore server-side warnings

### 2. Data Display

**✅ DO:**
- Use tables for comparing multiple items
- Use color-coded badges for status/priority
- Add icons for visual hierarchy
- Show loading states
- Handle empty states gracefully
- Make entire rows clickable (better UX)
- Use gradients/colors to create visual interest

**❌ DON'T:**
- Use cards when tables are more appropriate
- Rely only on colors (add text labels)
- Leave loading/empty states unhandled
- Make users hunt for clickable areas

### 3. State Management

**✅ DO:**
- Centralize API calls in dedicated files
- Use Pinia stores for shared state
- Handle errors at multiple levels
- Throw errors for caller handling
- Refresh data after mutations
- Use watchers for reactive updates
- `clearError()` after each action

**❌ DON'T:**
- Make API calls directly from components
- Ignore error states
- Forget to reset form after submit
- Mix data fetching and UI logic

### 4. Backend Design

**✅ DO:**
- Validate all inputs (vessel, items existence, item status)
- Use repository pattern for database operations
- Implement proper pagination
- Use transactions for multi-table operations
- Generate unique codes (timestamps)
- Include related data in responses
- Run parallel queries with `Promise.all()` for performance

**❌ DON'T:**
- Trust client-side validation alone
- Query database in controllers
- Return all records without pagination
- Expose internal IDs without validation
- Miss status-transition guards (e.g., can only review `Waiting`)

### 5. Code Organization

**✅ DO:**
- Group by feature, not by type
- Use consistent naming conventions
- Extract reusable components
- Document complex logic
- Keep components focused (SRP)

**File Structure:**
```
features/request/
├── views/           # Pages
├── component/       # Feature-specific components
├── store.js         # State management
└── api.js           # HTTP layer
```

---

## Testing Guide

### Manual Testing Checklist

**Create Request:**
- [ ] Click "New Request" button opens form
- [ ] Vessel dropdown populated (shows IMO number)
- [ ] Items dropdown populated (shows code and ID)
- [ ] Date defaults to today
- [ ] Priority defaults to "Medium"
- [ ] Step 1 validation: missing vessel or date shows error
- [ ] "Next" button moves to Step 2
- [ ] "Previous" button returns to Step 1
- [ ] "Add Item" adds new item row
- [ ] "Remove Item" removes row (min 1 enforced)
- [ ] Duplicate item detection: error message if same item added twice
- [ ] Submit → validation dialog appears if warnings exist
- [ ] "Go Back & Edit" closes dialog, form remains open
- [ ] "Tetap Ajukan" → request created, list refreshes
- [ ] Request with no warnings → created directly (no dialog)
- [ ] Request status: "Approved by system" (no warnings) or "Waiting" (warnings)

**View & Review Request:**
- [ ] Click any table row opens view dialog
- [ ] Request code + date displayed in header
- [ ] Vessel info with Ship icon
- [ ] User info with User icon
- [ ] Status + Priority badges displayed
- [ ] Justification shown if present
- [ ] Items shown in DataTable format with all columns
- [ ] Staff Actions panel only shown for "Waiting" requests
- [ ] "Adjust items?" checkbox shows qty +/- controls per item
- [ ] Approve without adjustment → qtyApproved = qtyRequested
- [ ] Approve with adjustment → item qty and staffJustification saved
- [ ] Reject → reject reason required, saved to rejectReason
- [ ] After review → list refreshes, dialog closes
- [ ] PDF button visible only for Approved/Approved by system
- [ ] Full PDF download works
- [ ] Per-item PDF download works (Actions column)

**Search & Pagination:**
- [ ] Search by request code works
- [ ] Search debounces (500ms)
- [ ] Pagination Previous/Next buttons
- [ ] Page info displays correctly
- [ ] Table updates on page change

---

## Future Enhancements

### Planned Features

1. **Draft Requests**
   - Save incomplete requests
   - Resume editing later

2. **Advanced Search**
   - Filter by status (UI for status dropdown)
   - Filter by priority
   - Filter by date range
   - Filter by vessel
   - Export to Excel

3. **Request Templates**
   - Save common request patterns
   - Quick create from template
   - Vessel-specific templates

4. **Bulk Operations**
   - Approve multiple requests at once
   - Export multiple requests

5. **Notifications**
   - Email on request creation
   - Push notifications for status changes
   - In-app notification center

### Technical Improvements

1. **Performance**
   - Request caching for master data (vessels, items)
   - Virtual scrolling for large lists

2. **Error Handling**
   - Retry failed requests
   - Better validation error messages with field highlighting

3. **Testing**
   - E2E tests with Playwright
   - API tests with Supertest

---

## Lessons Learned

### What Worked Well

1. **Multi-step forms** reduced cognitive load significantly
2. **Two-phase submit** (validate → confirm → create) gave users visibility into issues
3. **Reusable DataTable** component saved development time
4. **Repository pattern** kept code organized and testable
5. **`Promise.all()`** for parallel validation lookups improved performance
6. **Lucide icons** improved visual appeal without bloat
7. **Pinia stores** made state management straightforward
8. **Server-side pagination** prevented performance issues
9. **Drizzle ORM** provided type safety and query composability

### What We'd Do Differently

1. **Plan validation rules upfront** – adding them later required refactoring the entire create flow
2. **Document as we build** – easier than reconstructing later
3. **Create reusable components first** – saves refactoring time
4. **Plan the review workflow early** – the staff review/adjust flow was added iteratively

### Key Takeaways

> **"Two-phase submit is better than post-error rollback."**  
> Running `/validate` before `/create` gives users a chance to review warnings without losing their form data.

> **"Consistency over customization."**  
> Using DataTable everywhere created a more cohesive experience.

> **"Database derives the truth."**  
> Status should always be derived server-side based on real data, not trusted from client.

---

## Related Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [MOC-IMPLEMENTATION.md](./MOC-IMPLEMENTATION.md) - MOC module (next step after Vessel Request)
- [DOCUMENTATION-INDEX.md](./DOCUMENTATION-INDEX.md) - All documentation

---

## Appendix

### Color Scheme Reference

**Status Colors:**
```javascript
{
  'Approved by system': 'bg-green-100 text-green-800',
  Waiting:   'bg-yellow-100 text-yellow-800',
  Approved:  'bg-green-100 text-green-800',
  Rejected:  'bg-red-100 text-red-800',
  Pending:   'bg-blue-100 text-blue-800',
  Completed: 'bg-purple-100 text-purple-800',
}
```

**Priority Colors:**
```javascript
{
  High:   'bg-red-100 text-red-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low:    'bg-green-100 text-green-800',
}
```

### API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/vessel-requests` | Create new request |
| POST | `/vessel-requests/validate` | Pre-validate without creating |
| POST | `/vessel-requests/list` | Get paginated list (supports search + status filter) |
| POST | `/vessel-requests/list/:id` | Get single request with all items |
| PUT | `/vessel-requests/:id` | Update request |
| POST | `/vessel-requests/:id/review` | Staff approve or reject |
| GET | `/vessel-requests/:id/pdf` | Generate & download PDF (full or `?itemId=n`) |

### Database Relations

```
User ─┐
      ├──> VesselRequest ──> VesselRequestItem ──> MstItem
      │         │                  │
      │    (reviewedBy)          (mocs)──> MOC
MstVessel ─┘
```

---

**Document Maintainer:** Development Team  
**Review Cycle:** After each major feature update  
**Feedback:** Create issue with label `documentation`

---

*This document serves as both implementation guide and template for future modules. Keep it updated as the feature evolves.*
