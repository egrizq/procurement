# MOC (Matrix of Comparison) Module - Implementation Guide

**Module Name:** MOC – Matrix of Comparison  
**Status:** ✅ Complete (with ongoing improvements)  
**Created:** May 2026  
**Last Updated:** May 2026  
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [SAW Algorithm](#saw-algorithm)
6. [Data Flow](#data-flow)
7. [Best Practices](#best-practices)
8. [Testing Guide](#testing-guide)
9. [Future Enhancements](#future-enhancements)

---

## Overview

### Purpose

The MOC (Matrix of Comparison) module enables procurement staff to compare multiple vendors for a specific approved vessel request item, score them using the **SAW (Simple Additive Weighting)** algorithm, select the best vendor, and proceed to create a Purchase Order.

MOC is the second stage in the procurement pipeline:

```
Vessel Request → (Approved) → MOC → (Vendor Selected) → Purchase Order
```

### Key Features

- ✅ 3-step wizard for creating/editing MOC
  - Step 1: Select approved request & item
  - Step 2: Build vendor comparison matrix (min 3 vendors)
  - Step 3: View SAW scoring results & pick final vendor
- ✅ SAW (Simple Additive Weighting) scoring with full breakdown display
- ✅ Per-criterion breakdown: normalized values + weighted contribution
- ✅ SAW winner auto-selected; staff can override with warning
- ✅ Save as Draft or Complete (with vendor selection → triggers PO creation flow)
- ✅ Edit mode: loads existing MOC and restores state
- ✅ Paginated MOC list with search (request code, vessel name, item name)
- ✅ List shows: selected vendor name + SAW score, PO status, MOC status
- ✅ Delete MOC (with SweetAlert2 confirmation)
- ✅ Integration with Vessel Request, Vendor master data, and Purchase Order modules

### Statuses

| Status | Description |
|--------|-------------|
| `Draft` | MOC saved with vendor data but not finalized |
| `Completed` | SAW run, vendor selected, ready for PO |

### User Flow

```
1. Staff clicks "Create MOC"
2. Step 1: Select an approved vessel request (only requests with available items)
         → Select specific item to compare (only items not yet assigned to any MOC)
3. Step 2: Fill vendor matrix (min 3 vendors)
         → Per vendor: select vendor, unit price, available qty, warranty, discount, remarks
         → "Simpan Draft" to save progress
         → "Lanjut Scoring →" to proceed
4. Step 3: View SAW scoring results (ranked with breakdown)
         → SAW winner auto-selected for final vendor
         → Can manually override (shows warning if differs from SAW)
         → "Simpan Draft" to save
         → "Pilih Vendor & Lanjutkan PO" → sets status = Completed → navigates to PO creation
5. Click any MOC row to edit (reopens wizard at Step 2)
```

---

## Architecture

### Technology Stack

**Backend:**
- Express.js (REST API)
- Drizzle ORM (MySQL)
- Zod (Validation)
- TypeScript
- SAW scoring implemented in pure TypeScript (no external library)

**Frontend:**
- Vue 3 (Composition API, `<script setup>`)
- Pinia (State Management)
- Vite (Build Tool)
- Tailwind CSS (Styling)
- Lucide Vue Next (UI Icons)
- SweetAlert2 (Confirmation dialogs)

### Module Structure

```
Backend (apps/api):
├── src/modules/moc/
│   ├── moc.controller.ts       # Request handlers (createMoc, getMocs, getMocById, updateMoc, deleteMoc, scoreMoc)
│   ├── moc.repository.ts       # Database operations + SAW algorithm implementation
│   ├── moc.routes.ts           # Route definitions
│   └── moc.validation.ts       # Zod schema imports

├── src/db/schema/
│   ├── moc.ts                  # Drizzle table definitions (mocs, mocVendors)
│   └── enums.ts                # mocStatusEnum

Frontend (apps/web):
├── src/features/moc/
│   ├── views/
│   │   └── Index.vue           # MOC list view
│   ├── components/
│   │   ├── FormMoc.vue         # 3-step wizard (create + edit)
│   │   └── ScoringMoc.vue      # (additional scoring view component)
│   ├── store.js                # Pinia store
│   ├── api.js                  # HTTP service layer
│   └── routes.js               # Vue Router routes
```

---

## Backend Implementation

### 1. Database Schema (Drizzle)

**Location:** `apps/api/src/db/schema/moc.ts`

```typescript
// mocs table
export const mocs = mysqlTable('mocs', {
  id:                 int('id').primaryKey().autoincrement(),
  vesselRequestId:    int('vessel_request_id').notNull().references(() => vesselRequests.id),
  vesselRequestItemId:int('vessel_request_item_id').notNull().references(() => vesselRequestItems.id),
  status:             mysqlEnum('status', mocStatusEnum).default('Draft').notNull(),
  selectedVendorId:   int('selected_vendor_id').references(() => mstVendors.id),  // nullable until Completed
  createdBy:          int('created_by').notNull().references(() => users.id),
  createdAt:          timestamp('created_at').defaultNow().notNull(),
  updatedAt:          timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// moc_vendors table
export const mocVendors = mysqlTable('moc_vendors', {
  id:           int('id').primaryKey().autoincrement(),
  mocId:        int('moc_id').notNull().references(() => mocs.id, { onDelete: 'cascade' }),
  vendorId:     int('vendor_id').notNull().references(() => mstVendors.id),
  unitPrice:    int('unit_price').notNull(),
  availableQty: int('available_qty').notNull().default(0),
  warranty:     int('warranty').notNull().default(0),         // months
  discount:     int('discount').notNull().default(0),          // percentage
  sawScore:     decimal('saw_score', { precision: 10, scale: 4 }),  // set after scoring
  remarks:      text('remarks'),
  isSelected:   boolean('is_selected').default(false).notNull(),
});
```

**Status Enum:**
```typescript
export const mocStatusEnum = ['Draft', 'Completed', 'Approved'] as const;
```

**Relations:**
- `mocs` → `vesselRequests` (many-to-one)
- `mocs` → `vesselRequestItems` (many-to-one)
- `mocs` → `users` (many-to-one, createdBy)
- `mocs` → `mstVendors` (many-to-one, selectedVendor)
- `mocs` → `mocVendors` (one-to-many)
- `mocs` → `purchaseOrders` (one-to-many)
- `mocVendors` → `mstVendors` (many-to-one)

### 2. Repository Pattern

**Location:** `apps/api/src/modules/moc/moc.repository.ts`

**Key Methods:**

```typescript
class MocRepository {
  // Create MOC with vendors in a transaction
  async createMoc(data: any, createdBy: number): Promise<Moc>
  // If status === 'Completed': runs calculateSAW() on vendors before insert

  // Get paginated list with search across request code, item name, vessel name
  async getMocs(page, limit, search, status?): Promise<{ items, total }>

  // Get single MOC with full relations
  async getMocById(id: number): Promise<Moc | null>
  // Includes: user, vesselRequest (+ vessel), vesselRequestItem (+ item), mocVendors (+ vendor), selectedVendor, purchaseOrders

  // Update MOC: delete all existing vendors, re-insert
  async updateMoc(id: number, data: any): Promise<Moc>
  // Uses transaction: update header → delete mocVendors → insert new mocVendors
  // If status === 'Completed': runs calculateSAW() on vendors before insert

  // Delete MOC (cascade deletes mocVendors via FK constraint)
  async deleteMoc(id: number): Promise<void>

  // Dedicated scoring: runs calculateSAWWithBreakdown(), persists scores
  async scoreMoc(id: number): Promise<{ moc, breakdown }>
  // Requires minimum 2 vendors
  // Returns full breakdown for UI display
}
```

**Design Decisions:**
- ✅ `updateMoc` deletes and re-inserts all vendors (simpler than diff-based update)
- ✅ `onDelete: 'cascade'` on `mocVendors.mocId` ensures vendor rows are cleaned up
- ✅ SAW calculation runs server-side on every create/update with `Completed` status
- ✅ `scoreMoc` persists scores in DB (canonical truth), frontend calculates live preview

### 3. SAW Algorithm Implementation

**Location:** `apps/api/src/modules/moc/moc.repository.ts`

```typescript
// SAW Weights
const SAW_WEIGHTS = {
  unitPrice:    0.40,  // cost   → lower is better (minimized)
  availableQty: 0.25,  // benefit → higher is better (maximized)
  warranty:     0.20,  // benefit → higher is better
  discount:     0.15,  // benefit → higher is better
};

// Simple scoring (used at create/update)
function calculateSAW(vendors: any[]): any[] {
  const minPrice = Math.min(...vendors.map(v => v.unitPrice || 1));
  const maxQty   = Math.max(...vendors.map(v => v.availableQty || 0));
  const maxWar   = Math.max(...vendors.map(v => v.warranty || 0));
  const maxDis   = Math.max(...vendors.map(v => v.discount || 0));

  const scored = vendors.map(v => {
    const rPrice = minPrice / (v.unitPrice || 1);          // cost: min/value
    const rQty   = maxQty > 0 ? (v.availableQty || 0) / maxQty : 0;  // benefit: value/max
    const rWar   = maxWar > 0 ? (v.warranty || 0) / maxWar : 0;
    const rDis   = maxDis > 0 ? (v.discount || 0) / maxDis : 0;

    const score = SAW_WEIGHTS.unitPrice * rPrice +
                  SAW_WEIGHTS.availableQty * rQty +
                  SAW_WEIGHTS.warranty * rWar +
                  SAW_WEIGHTS.discount * rDis;

    return { ...v, sawScore: parseFloat(score.toFixed(4)) };
  });

  const maxScore = Math.max(...scored.map(v => v.sawScore));
  return scored.map(v => ({ ...v, isSelected: v.sawScore === maxScore }));
}

// Detailed scoring with full breakdown (used by /score endpoint)
function calculateSAWWithBreakdown(vendors: any[]) {
  // Returns: { vendors: [{ ...v, normalized, weighted, sawScore, rank, isSelected }], weights, minPrice, maxQty, maxWar, maxDis }
}
```

### 4. Controller Logic

**Location:** `apps/api/src/modules/moc/moc.controller.ts`

```typescript
const createMoc = asyncHandler(async (req, res) => {
  const userId = req.apiToken!.userId;
  const newMoc = await mocRepo.createMoc(req.body, userId);
  return success(res, { moc: newMoc }, 201);
});

const getMocs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', status } = req.body;
  const result = await mocRepo.getMocs(page, limit, search, status);
  const pagination = getPaginationMeta(page, limit, result.total);
  return success(res, { mocs: result.items, pagination });
});

const getMocById = asyncHandler(async (req, res) => {
  const moc = await mocRepo.getMocById(Number(req.params.id));
  if (!moc) throw new AppError('MOC not found', 404);
  return success(res, { moc });
});

const updateMoc = asyncHandler(async (req, res) => {
  const updatedMoc = await mocRepo.updateMoc(Number(req.params.id), req.body);
  return success(res, { moc: updatedMoc });
});

const deleteMoc = asyncHandler(async (req, res) => {
  await mocRepo.deleteMoc(Number(req.params.id));
  return success(res, { message: 'MOC deleted successfully' });
});

const scoreMoc = asyncHandler(async (req, res) => {
  try {
    const result = await mocRepo.scoreMoc(Number(req.params.id));
    return success(res, result);  // { moc, breakdown }
  } catch (err: any) {
    throw new AppError(err.message || 'Failed to calculate SAW score', 400);
  }
});
```

### 5. Routes Configuration

**Location:** `apps/api/src/modules/moc/moc.routes.ts`

```typescript
// All routes use apiAuth() middleware (applied globally via router.use)
router.use(apiAuth());

router.post('/list',       validate(mocListSchema),   controller.getMocs);
router.post('/',           validate(mocSchema),        controller.createMoc);
router.get('/:id',         validate(mocByIdSchema),    controller.getMocById);
router.put('/:id',         validate(mocSchema),        controller.updateMoc);
router.delete('/:id',      validate(mocByIdSchema),    controller.deleteMoc);
router.post('/:id/score',  validate(mocByIdSchema),    controller.scoreMoc);
```

**Design Decisions:**
- ✅ `GET /:id` (not `POST /list/:id`) for single item – MOC doesn't reuse the POST-for-get pattern
- ✅ `POST /:id/score` – dedicated scoring endpoint that persists scores in DB
- ✅ Auth applied globally with `router.use(apiAuth())`

---

## Frontend Implementation

### 1. Main List View

**Location:** `apps/web/src/features/moc/views/Index.vue`

**Key Features:**
- Server-side pagination
- Real-time search with debouncing (500ms) across request code, item name, vessel name
- Row-click navigation to open edit wizard
- Rich table columns with custom cell renderers
- Delete with SweetAlert2 confirmation

**Table Columns:**
```javascript
const columns = [
  { key: 'requestCode',  label: 'Request Code' },
  { key: 'vessel',       label: 'Vessel' },
  { key: 'item',         label: 'Item Details' },    // Shows item name + qty approved + unit
  { key: 'vendorsCount', label: 'Vendors' },          // Shows vendor count badge
  { key: 'winner',       label: 'Selected Option' },  // Shows winning vendor name + SAW score
  { key: 'poStatus',     label: 'PO' },               // Shows PO number + PO status if exists
  { key: 'status',       label: 'Status' },           // Draft / Completed / Approved
  { key: 'updatedAt',    label: 'Last Updated' },
]
```

**Winner Detection:**
```javascript
const getWinner = (mocRow) => {
  return mocRow.mocVendors?.find(v => v.isSelected) || null
}
// In template: displays vendor name + SAW score as percentage
```

**PO Status Display:**
```html
<!-- Shows first linked PO number + status with color coding -->
<span>{{ row.purchaseOrders[0].poNumber }}</span>
<span :class="{
  'text-amber-600': status === 'Pending Approval',
  'text-sky-600':   status === 'Auto Approved',
  'text-emerald-600': status === 'Approved',
  'text-red-500':   status === 'Rejected',
}">{{ status }}</span>
```

**Navigation to PO:**
```javascript
const handleGoToPO = (mocId) => {
  closeWizard()
  router.push({ path: '/purchase-order', query: { moc_id: mocId } })
}
```

### 2. MOC Wizard Form Component

**Location:** `apps/web/src/features/moc/components/FormMoc.vue`

**3-Step Wizard** (Step 1 only shown in create mode; edit mode starts at Step 2):

#### Step 1 – Select Request & Item (create only)

```html
<!-- Approved request selector – only shows requests with availableForMocCount > 0 -->
<select v-model="wizardData.vesselRequestId" @change="handleRequestChange">
  <option v-for="req in approvedRequests.filter(r => r.availableForMocCount > 0)">
    {{ req.requestCode }} - {{ req.vessel?.name }} (Requested by: {{ req.user?.fullName }})
  </option>
</select>

<!-- Item cards grid – only shows items not yet in any MOC -->
<div v-for="item in approvedItems" @click="selectRequestItem(item)"
  :class="{ selected: wizardData.vesselRequestItemId === item.id }">
  <h5>{{ item.item?.name }}</h5>
  <span>Qty Approved: {{ item.qtyApproved }} {{ item.unit }}</span>
</div>
```

**Approved items filter:**
```javascript
approvedItems.value = full.vesselRequestItems?.filter(i =>
  (i.status === 'Approved' || i.status === 'Approved by system' || i.qtyApproved > 0) &&
  (!i.mocs || i.mocs.length === 0)  // Not already in a MOC
) || []
```

#### Step 2 – Vendor Comparison Matrix

```html
<!-- Summary header bar (request code, vessel, item, approved qty) -->
<div class="bg-slate-50 ...">{{ summaryRequestCode }} / {{ summaryVesselName }} / ...</div>

<!-- Grid of vendor cards (min 3, can add more) -->
<div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
  <div v-for="(matrix, idx) in wizardData.vendors">
    <!-- Card Header: Vendor #N + Remove button (disabled if ≤ 3) -->
    <!-- Card Body:
         - Vendor dropdown (from master data)
         - Unit Price (IDR) – shows formatted number below
         - Available Qty
         - Warranty (months)
         - Discount (%)
         - Remarks (textarea)
    -->
  </div>
</div>

<!-- Footer buttons:
     - "← Back" (if step > 1)
     - "Cancel" or "Tutup" (if Completed)
     - "Simpan Draft" (saves without scoring)
     - "Lanjut Scoring →" or "Lihat Scoring →" (if Completed)
-->
```

**Vendor Data Validation:**
```javascript
const validateVendorData = (requireAllFilled = true) => {
  const active = vendors.filter(v => v.vendorId !== null)
  if (active.length < 1) → 'Please choose at least one vendor'
  if (duplicate vendorIds) → 'Duplicate vendors found'
  if (requireAllFilled) {
    if (vendors.length < 3) → 'Minimum 3 vendors required'
    if (any vendor has no vendorId) → 'Please select a vendor for all entries'
    if (any vendor unitPrice <= 0) → 'Please enter a valid price (> 0) for all vendors'
    if (any vendor availableQty <= 0) → 'Please enter available qty (> 0) for all vendors'
  }
}
```

#### Step 3 – SAW Scoring Results

```html
<!-- Summary header (same as Step 2) -->

<!-- SAW weight badges: Harga 40% | Qty 25% | Garansi 20% | Diskon 15% -->

<!-- Scoring cards grid (sorted by rank) -->
<div v-for="v in sawResults">
  <!-- Card Header: Medal emoji + Rank # + WINNER badge (if rank === 1) -->
  <!-- Card Body:
       - Vendor Name
       - SAW Score % (large font, progress bar)
       - Per-criterion breakdown:
           Harga:   normalized (r_price) → weighted contribution (%)
           Qty:     normalized (r_qty) → weighted contribution (%)
           Garansi: normalized (r_war) → weighted contribution (%)
           Diskon:  normalized (r_dis) → weighted contribution (%)
  -->
  <!-- Card Footer: Σ weighted score (raw 4-decimal value) -->
</div>

<!-- Formula note card: explains Cost vs Benefit normalization + formula -->

<!-- Final Vendor Picker:
     - SAW winner pre-selected
     - Clickable cards to override selection
     - Warning alert if selection differs from SAW winner
-->

<!-- Footer buttons:
     - "← Back"
     - "Simpan Draft"
     - "Pilih Vendor & Lanjutkan PO" (disabled if no vendor selected)
-->
```

**Client-Side SAW Preview (`computeSAW`):**

The frontend calculates SAW locally before calling the backend `scoreMoc` endpoint, giving an instant preview:

```javascript
const computeSAW = () => {
  const active = wizardData.value.vendors.filter(v => v.vendorId !== null && Number(v.unitPrice) > 0)
  if (active.length < 2) return []

  // Same algorithm as backend:
  // Cost: rPrice = minPrice / unitPrice
  // Benefit: rQty = availableQty / maxQty, rWar = warranty / maxWar, rDis = discount / maxDis
  // Score = 0.40*rPrice + 0.25*rQty + 0.20*rWar + 0.15*rDis

  return scored.map(v => ({
    ...v,
    vendorName: masterVendors.find(mv => mv.id === v.vendorId)?.name,
    normalized: { rPrice, rQty, rWar, rDis },
    weighted:   { wPrice, wQty, wWar, wDis },
    sawScore,
    rank,
    isWinner: sawScore === maxScore,
  })).sort((a, b) => a.rank - b.rank)
}
```

**Save Actions:**

```javascript
// Build payload helper
const buildPayload = (status) => ({
  vesselRequestId:     Number(wizardData.value.vesselRequestId),
  vesselRequestItemId: Number(wizardData.value.vesselRequestItemId),
  status,
  vendors: toSend.map(v => ({
    vendorId, unitPrice, availableQty, warranty, discount, remarks,
    isSelected: false,  // Backend SAW decides isSelected for Completed
  })),
})

// Save as Draft
const saveDraft = async () => {
  // validateVendorData(false) – loose validation (allows incomplete data)
  const payload = buildPayload('Draft')
  // Calls createMoc or updateMoc depending on isEditMode
}

// Complete with vendor + go to PO
const completeWithVendorAndPO = async () => {
  // validateVendorData(true) – strict validation
  // Shows SweetAlert2 warning if selectedVendor differs from SAW winner
  payload.selectedVendorId = selectedVendorId.value
  const payload = buildPayload('Completed')
  // Backend runs SAW and sets isSelected
  emit('saved')
  emit('go-to-po', savedMoc?.id)
  // Index.vue: router.push('/purchase-order?moc_id=...')
}
```

**Edit Mode Initialization:**
```javascript
const initForm = async () => {
  if (props.isEditMode && props.mocId) {
    currentStep.value = 2  // Skip Step 1 in edit mode
    await mocStore.fetchMocById(props.mocId)
    const current = mocStore.currentMoc
    // Load vendors from DB, pad to minimum 3
    while (loaded.length < 3) loaded.push(makeEmptyVendor())
    wizardData.value = { vesselRequestId, vesselRequestItemId, status, vendors: loaded }
  } else {
    currentStep.value = 1
    await fetchApprovedRequestsList()
  }
}
```

### 3. Pinia Store

**Location:** `apps/web/src/features/moc/store.js`

```javascript
export const useMocStore = defineStore('moc', {
  state: () => ({
    mocs: [],
    currentMoc: null,
    requests: [],   // Approved requests (for Step 1 select)
    pagination: {},
    error: null,
  }),
  actions: {
    // Fetch approved requests for Step 1 dropdown
    async fetchApprovedRequests(page, limit, search),

    // MOC CRUD
    async fetchMocs(page, limit, search, status),
    async fetchMocById(id),           // Sets this.currentMoc
    async createMoc(mocData),         // Returns new MOC
    async updateMoc(id, mocData),     // Returns updated MOC
    async deleteMoc(id),

    // SAW scoring endpoint (persists scores in DB)
    async scoreMoc(id),               // Returns { moc, breakdown }

    clearError(),
  },
})
```

**Error Handling Pattern:**
```javascript
// Supports Zod validation error array format
try {
  // ...
} catch (error) {
  if (error.errors && Array.isArray(error.errors)) {
    this.error = error.errors.map(err => err.message).join(', ')
  } else {
    this.error = error.error || 'Failed to ...'
  }
  throw error  // Re-throw for component-level handling
}
```

### 4. API Service Layer

**Location:** `apps/web/src/features/moc/api.js`

```javascript
export async function getMocs(page, limit, search, status)  // POST /moc/list
export async function getMocById(id)                         // GET /moc/:id
export async function createMoc(mocData)                     // POST /moc
export async function updateMoc(id, mocData)                 // PUT /moc/:id
export async function deleteMoc(id)                          // DELETE /moc/:id
export async function scoreMoc(id)                           // POST /moc/:id/score
```

---

## SAW Algorithm

### What is SAW?

**Simple Additive Weighting (SAW)** is a multi-criteria decision-making method. Each criterion is normalized to [0,1] and multiplied by its weight. The vendor with the highest total weighted score wins.

### Criteria & Weights

| Criterion | Weight | Type | Formula |
|-----------|--------|------|---------|
| Unit Price (Harga) | **40%** | Cost (lower = better) | `r = min_price / vendor_price` |
| Available Qty | **25%** | Benefit (higher = better) | `r = vendor_qty / max_qty` |
| Warranty (Garansi) | **20%** | Benefit (higher = better) | `r = vendor_warranty / max_warranty` |
| Discount | **15%** | Benefit (higher = better) | `r = vendor_discount / max_discount` |

### Formula

```
SAW Score = (r_price × 0.40) + (r_qty × 0.25) + (r_warranty × 0.20) + (r_discount × 0.15)
```

### Example Calculation

Given 3 vendors:

| Vendor | Price (IDR) | Qty | Warranty (mo) | Discount (%) |
|--------|-------------|-----|----------------|--------------|
| A | 500,000 | 100 | 12 | 5 |
| B | 400,000 | 80 | 6 | 10 |
| C | 600,000 | 120 | 18 | 3 |

**Normalization:**
- `min_price = 400,000`, `max_qty = 120`, `max_war = 18`, `max_dis = 10`

| Vendor | r_price | r_qty | r_war | r_dis | SAW Score |
|--------|---------|-------|-------|-------|-----------|
| A | 0.8000 | 0.8333 | 0.6667 | 0.5000 | 0.40×0.8 + 0.25×0.8333 + 0.20×0.6667 + 0.15×0.5 = **0.7458** |
| B | 1.0000 | 0.6667 | 0.3333 | 1.0000 | 0.40×1.0 + 0.25×0.6667 + 0.20×0.3333 + 0.15×1.0 = **0.8834** |
| C | 0.6667 | 1.0000 | 1.0000 | 0.3000 | 0.40×0.6667 + 0.25×1.0 + 0.20×1.0 + 0.15×0.3 = **0.7617** |

→ **Winner: Vendor B** (SAW = 0.8834)

### Edge Cases

- If `max_qty = 0` (all vendors have 0 qty): `r_qty = 0` for all → criterion ignored effectively
- If only 1 vendor with non-zero price: at least 2 vendors required for meaningful comparison
- `scoreMoc` endpoint throws if `< 2 vendors` exist in MOC

---

## Data Flow

### MOC Creation Flow

```
1. Staff clicks "Create MOC"
   └─> isWizardOpen = true, isEditMode = false
   └─> initForm(): fetchApprovedRequests(1, 100, '')
   └─> Filtered: only requests with availableForMocCount > 0

2. Step 1: Select Request & Item
   └─> handleRequestChange(): fetchRequestById(vesselRequestId)
   └─> approvedItems = items with (status=Approved or Approved by system) AND no MOC yet
   └─> Auto-select if only 1 approved item
   └─> goToStep2(): validates vesselRequestId + vesselRequestItemId

3. Step 2: Fill Vendor Matrix
   └─> 3 empty vendor cards pre-populated
   └─> Staff fills vendor info per card
   └─> "Simpan Draft": buildPayload('Draft') → POST /moc
   └─> "Lanjut Scoring →": validateVendorData(false) → computeSAW() → goToStep 3

4. Step 3: SAW Scoring Review
   └─> sawResults populated from computeSAW() (client-side preview)
   └─> SAW winner auto-selected
   └─> Staff can override selection (warning if different from SAW winner)
   └─> "Simpan Draft": buildPayload('Draft') → POST /moc or PUT /moc/:id
   └─> "Pilih Vendor & Lanjutkan PO":
       ├─> Show SweetAlert2 warning if non-SAW vendor selected
       ├─> buildPayload('Completed') + selectedVendorId
       ├─> POST /moc (or PUT /moc/:id if edit)
       ├─> Backend runs calculateSAW() → sets sawScore + isSelected
       ├─> emit('saved') + emit('go-to-po', mocId)
       └─> router.push('/purchase-order?moc_id=...')
```

### MOC Edit Flow

```
1. Staff clicks any MOC row in list
   └─> openEditWizard(mocRow): selectedMocId = mocRow.id, isEditMode = true
   └─> isWizardOpen = true

2. initForm() (edit mode):
   └─> currentStep = 2 (skip Step 1)
   └─> fetchMocById(mocId) → loads vendors from DB
   └─> Fills wizardData with existing vendor data

3. Staff edits vendor info
4. Same save/scoring flow as create
```

### Score Persistence Flow

```
1. Frontend: completeWithVendorAndPO()
   └─> buildPayload('Completed')
   └─> POST /moc or PUT /moc/:id

2. Backend:
   └─> if status === 'Completed': calculateSAW(vendors) before insert
   └─> Sets: sawScore per vendor, isSelected for winner

3. Result persisted in moc_vendors
   └─> isSelected = true for winner (or selectedVendorId if override)

4. List view: getWinner() reads mocVendors.find(v => v.isSelected)
   └─> Shows vendor name + SAW score as percentage
```

---

## Best Practices

### 1. Vendor Comparison Design

**✅ DO:**
- Require minimum 3 vendors (procurement best practice)
- Show SAW breakdown per criterion (transparency)
- Auto-select SAW winner but allow override
- Warn users when overriding SAW recommendation
- Show formatted numbers (Rp 1.000.000 format for prices)

**❌ DON'T:**
- Allow duplicate vendors in same MOC
- Accept zero price as valid (>0 required)
- Allow completing MOC without selecting a vendor

### 2. SAW Algorithm Best Practices

**✅ DO:**
- Run server-side scoring on completion (canonical truth in DB)
- Run client-side preview for instant feedback (UX)
- Show both normalized values AND weighted contributions
- Use medal emojis (🥇🥈🥉) for intuitive ranking
- Explain formula to users (transparency card)

**❌ DON'T:**
- Trust only client-side SAW scores
- Skip validation for minimum vendor count
- Allow scoring with `< 2 vendors`

### 3. State Management

**✅ DO:**
- `fetchApprovedRequests()` before Step 1 to get fresh data
- `fetchMocById()` before edit to load latest vendor data
- Pad vendor array to minimum 3 when loading from DB
- Clear `currentMoc` after closing wizard

**❌ DON'T:**
- Reuse stale vendor data from list view in wizard
- Trust `availableForMocCount` from stale state – refresh before Step 1

### 4. UX Patterns

**✅ DO:**
- Show summary header bar on Steps 2 & 3 (request/vessel/item context)
- Disable vendor inputs when MOC is Completed (read-only view)
- Change button text: "Tutup" instead of "Cancel" for Completed MOCs
- "Lihat Scoring →" instead of "Lanjut Scoring →" when Completed
- Show PO link info in list table (actionable connection to next step)

**❌ DON'T:**
- Allow editing Completed MOC vendor data (show read-only)
- Navigate away without saving draft warning (currently not implemented)

---

## Testing Guide

### Manual Testing Checklist

**Create MOC:**
- [ ] "Create MOC" button opens wizard at Step 1
- [ ] Only approved requests with available items shown in dropdown
- [ ] Request items: only shows approved items not yet in a MOC
- [ ] Auto-selects item if only 1 available
- [ ] "Next →" disabled without request + item selection
- [ ] Step 2 shows summary header bar (request code, vessel, item, qty)
- [ ] 3 empty vendor cards pre-populated
- [ ] "Add Vendor" adds new card
- [ ] "Remove" disabled when exactly 3 vendors
- [ ] Vendor dropdown populated from master data
- [ ] Price shows formatted (Rp 1.000.000) below input
- [ ] "Simpan Draft" saves with at least 1 vendor selected
- [ ] "Lanjut Scoring →" validates minimum 3 vendors + prices
- [ ] Step 3 shows ranked scoring cards
- [ ] Rank 1 has 🥇 and WINNER badge
- [ ] SAW score progress bar visible
- [ ] Per-criterion breakdown shown
- [ ] SAW winner auto-selected in vendor picker
- [ ] Override warning alert appears if non-winner selected
- [ ] "Pilih Vendor & Lanjutkan PO": SweetAlert if non-SAW vendor
- [ ] On confirm: MOC saved, redirects to PO page with moc_id
- [ ] MOC appears in list with status "Completed"
- [ ] Winner vendor name + SAW% shown in "Selected Option" column

**Edit MOC:**
- [ ] Click any MOC row opens wizard at Step 2 (no Step 1)
- [ ] Vendor data loaded from DB
- [ ] Completed MOC: vendor inputs disabled (read-only)
- [ ] Completed MOC: "Tutup" instead of "Cancel", "Lihat Scoring →" instead of "Lanjut"
- [ ] Draft MOC: can edit and re-save

**List View:**
- [ ] Search by request code works
- [ ] Search by vessel name works
- [ ] Search by item name works
- [ ] Search debounces (500ms)
- [ ] "Selected Option" column shows winner vendor + SAW%
- [ ] "PO" column shows PO number + status if linked
- [ ] Delete with SweetAlert2 confirmation works
- [ ] Pagination works

---

## Future Enhancements

### Planned Features

1. **MOC Status Approval Workflow**
   - Manager approval for completed MOC
   - Approval history/log

2. **MOC Templates**
   - Save vendor comparison templates for recurring items
   - Quick-fill from previous comparisons

3. **Advanced Filtering**
   - Filter by status (UI toggle, currently commented out)
   - Filter by date range
   - Filter by vessel or item

4. **PDF Export for MOC**
   - Comparison matrix PDF report
   - SAW scoring breakdown PDF

5. **Audit Trail**
   - Track who changed what in MOC
   - Full history of vendor data changes

### Technical Improvements

1. **Optimistic Updates**
   - Update list immediately after save, refresh in background

2. **Form State Persistence**
   - Save draft wizard state to localStorage to prevent data loss

3. **Performance**
   - Lazy-load vendor master data only when needed
   - Cache approved requests list for session

---

## Appendix

### API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/moc/list` | Get paginated MOC list (search + status filter) |
| POST | `/moc` | Create new MOC (with vendors) |
| GET | `/moc/:id` | Get single MOC with full relations |
| PUT | `/moc/:id` | Update MOC (delete+re-insert vendors) |
| DELETE | `/moc/:id` | Delete MOC (cascades to moc_vendors) |
| POST | `/moc/:id/score` | Run SAW scoring and persist scores |

### Database Relations

```
VesselRequest ─┐
               ├──> MOC ──> MOCVendor ──> MstVendor
VesselRequestItem ─┘  │
                       └──> PurchaseOrder
User ──────────────────┘ (createdBy)
MstVendor (selectedVendor) ─┘
```

### SAW Weights Reference

```typescript
const SAW_WEIGHTS = {
  unitPrice:    0.40,  // 40% – most important (cost criterion)
  availableQty: 0.25,  // 25% – availability
  warranty:     0.20,  // 20% – reliability indicator
  discount:     0.15,  // 15% – commercial benefit
};
```

### Status Color Reference

```javascript
// MOC Status
'Draft':     'bg-amber-50 text-amber-700 border-amber-200'
'Completed': 'bg-purple-50 text-purple-700 border-purple-200'
'Approved':  'bg-emerald-50 text-emerald-700 border-emerald-200'

// PO Status (inside MOC list)
'Pending Approval': 'text-amber-600'
'Auto Approved':    'text-sky-600'
'Approved':         'text-emerald-600'
'Rejected':         'text-red-500'
```

---

**Document Maintainer:** Development Team  
**Review Cycle:** After each major feature update  
**Feedback:** Create issue with label `documentation`

---

## Related Documentation

- [VESSEL-REQUEST-IMPLEMENTATION.md](./VESSEL-REQUEST-IMPLEMENTATION.md) - Vessel Request module (prerequisite)
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [DOCUMENTATION-INDEX.md](./DOCUMENTATION-INDEX.md) - All documentation

---

*MOC is the bridge between an approved supply request and an actual Purchase Order. Keep this document updated as the SAW algorithm weights or vendor comparison criteria evolve.*
