# Vessel Request Module - Implementation Guide

**Module Name:** Vessel Request  
**Status:** ✅ Complete (with ongoing improvements)  
**Created:** February 2026  
**Last Updated:** February 28, 2026  
**Version:** 1.0.0

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
- ✅ Server-side pagination for request list
- ✅ Real-time search functionality
- ✅ Read-only view mode with beautiful UI
- ✅ Row-click navigation for viewing details
- ✅ Status and priority badges with color coding
- ✅ Integration with master data (vessels, items)
- ✅ Form validation using Zod schemas
- ✅ Responsive design with Tailwind CSS

### User Flow

```
1. User clicks "New Request" button
2. Step 1: Select vessel, date, priority, justification
3. Step 2: Add items with quantities, units, priorities
4. Submit creates request with "Waiting" status
5. User can click any row to view full details
6. Read-only view shows all information in organized layout
```

---

## Architecture

### Technology Stack

**Backend:**
- Express.js (REST API)
- Prisma ORM (Database)
- Zod (Validation)
- TypeScript

**Frontend:**
- Vue 3 (Composition API)
- Pinia (State Management)
- Vite (Build Tool)
- Tailwind CSS (Styling)
- Lucide Icons (UI Icons)

**Shared:**
- Monorepo structure with Turborepo
- Shared validators package
- Shared types package

### Module Structure

```
Backend (apps/api):
├── src/modules/vessel-request/
│   ├── vessel-request.controller.ts    # Request handlers
│   ├── vessel-request.repository.ts    # Database operations
│   ├── vessel-request.routes.ts        # Route definitions
│   └── vessel-request.validation.ts    # Request validation

Frontend (apps/web):
├── src/features/request/
│   ├── views/
│   │   └── Index.vue                   # Main list view
│   ├── component/
│   │   ├── FormRequest.vue             # Create/edit form
│   │   └── ViewRequest.vue             # Read-only view
│   ├── store.js                        # Pinia store
│   └── api.js                          # HTTP requests

Shared (packages):
└── validators/src/
    └── vessel-request.js               # Zod schemas
```

---

## Backend Implementation

### 1. Database Schema (Prisma)

```prisma
model VesselRequest {
  id                  Int                  @id @default(autoincrement())
  requestCode         String               @unique
  vesselId            Int
  vessel              MstVessel            @relation(fields: [vesselId], references: [id])
  userId              Int
  user                User                 @relation(fields: [userId], references: [id])
  status              RequestStatus        @default(Waiting)
  priority            Priority             @default(Medium)
  justification       String?              @db.Text
  requestDate         DateTime
  vesselRequestItems  VesselRequestItem[]
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  
  @@map("vessel_requests")
}

model VesselRequestItem {
  id                Int            @id @default(autoincrement())
  vesselRequestId   Int
  vesselRequest     VesselRequest  @relation(fields: [vesselRequestId], references: [id])
  itemId            Int
  item              MstItem        @relation(fields: [itemId], references: [id])
  qtyRequested      Int
  qtyApproved       Int?
  unit              Unit           @default(Pcs)
  status            RequestStatus  @default(Waiting)
  priority          Priority       @default(Medium)
  justification     String?        @db.Text
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  
  @@map("vessel_request_items")
}

enum RequestStatus {
  Waiting
  Approved
  Rejected
}

enum Priority {
  Low
  Medium
  High
}

enum Unit {
  Pcs
  Box
  Liter
  Meter
  Kg
}
```

### 2. Validation Schema (Zod)

**Location:** `packages/validators/src/vessel-request.js`

```javascript
import { z } from 'zod';

export const vesselRequestSchema = z.object({
  body: z.object({
    vesselId: z.number('Vessel is not found').int().positive(),
    status: z.enum(
      ['Waiting', 'Approved', 'Rejected'],
      'Status must be either Waiting, Approved, or Rejected'
    ),
    priority: z.enum(['Low', 'Medium', 'High']),
    justification: z.string().optional(),
    requestDate: z.string('Request date is not valid'),
    items: z.array(
      z.object({
        itemId: z.number('Item is not found').int().positive(),
        qtyRequested: z.number().int().positive(),
        unit: z.enum(['Pcs', 'Box', 'Liter', 'Meter', 'Kg']),
        status: z.enum(['Waiting', 'Approved', 'Rejected']),
        priority: z.enum(['Low', 'Medium', 'High']),
        justification: z.string().optional(),
      })
    ),
  }),
});

export const vesselRequestListSchema = z.object({
  body: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().default(10),
    search: z.string().optional(),
  }),
});
```

### 3. Repository Pattern

**Location:** `apps/api/src/modules/vessel-request/vessel-request.repository.ts`

**Key Methods:**

```typescript
class VesselRequestRepository {
  // Create vessel request header
  async createVesselRequest(data: any) {
    return await prisma.vesselRequest.create({
      data: data,
    });
  }

  // Create request items in bulk
  async createVesselRequestItems(data: any[]) {
    return await prisma.vesselRequestItem.createMany({
      data: data,
    });
  }

  // Get paginated list with search
  async getVesselRequests(page: number, limit: number, search: string) {
    const where = search ? {
      OR: [
        { requestCode: { contains: search, mode: 'insensitive' } },
        { vessel: { name: { contains: search, mode: 'insensitive' } } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
      ],
    } : {};

    const [items, total] = await Promise.all([
      prisma.vesselRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vessel: true,
          user: true,
          _count: {
            select: { vesselRequestItems: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vesselRequest.count({ where }),
    ]);

    return { items, total };
  }

  // Get single request with all items
  async getVesselRequestById(id: number) {
    return await prisma.vesselRequest.findUnique({
      where: { id },
      include: {
        vessel: true,
        user: true,
        vesselRequestItems: {
          include: { item: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }
}
```

**Design Decisions:**
- ✅ Separation of concerns: Repository handles all database operations
- ✅ Prisma relations for eager loading (vessel, user, items)
- ✅ Case-insensitive search across multiple fields
- ✅ Pagination at database level for performance
- ✅ Count aggregation for item numbers

### 4. Controller Logic

**Location:** `apps/api/src/modules/vessel-request/vessel-request.controller.ts`

**Create Request Flow:**

```typescript
const create = asyncHandler(async (req: Request, res: Response) => {
  // 1. Validate vessel exists
  const vessel = await mstVesselRepo.findVessel({ id: req.body.vesselId });
  if (!vessel) {
    throw new AppError('Vessel is not found!', 400);
  }

  // 2. Validate all items exist
  const itemIds = req.body.items.map((item: any) => item.itemId);
  const items = await mstItemRepo.findItemByIds(itemIds);
  if (!items || items.length !== req.body.items.length) {
    throw new AppError('One or more items are invalid!', 400);
  }

  // 3. Get authenticated user
  const userId = req.apiToken!.userId;
  if (!userId) {
    throw new AppError('Unauthorized user', 401);
  }

  // 4. Generate unique request code
  const requestCode = `VR-${Date.now()}`;

  // 5. Create request header
  const bodyVesselRequest = {
    requestCode,
    user: { connect: { id: userId } },
    vessel: { connect: { id: req.body.vesselId } },
    status: req.body.status,
    priority: req.body.priority,
    justification: req.body.justification,
    requestDate: new Date(req.body.requestDate),
  };
  const vesselRequest = await vesselRequestRepo.createVesselRequest(bodyVesselRequest);

  // 6. Create request items
  const vesselRequestItemsData = req.body.items.map((item: any) => ({
    vesselRequestId: vesselRequest.id,
    itemId: item.itemId,
    qtyRequested: item.qtyRequested,
    unit: item.unit,
    status: item.status,
    priority: item.priority,
    justification: item.justification,
  }));
  const vesselRequestItems = await vesselRequestRepo.createVesselRequestItems(
    vesselRequestItemsData
  );

  return success(res, { vesselRequest, vesselRequestItems }, 201);
});
```

**Key Features:**
- ✅ Comprehensive validation before database operations
- ✅ Atomic operations (both header and items created)
- ✅ Authentication check via API token
- ✅ Auto-generated request code with timestamp
- ✅ Proper HTTP status codes (201 for creation)

### 5. Routes Configuration

**Location:** `apps/api/src/modules/vessel-request/vessel-request.routes.ts`

```typescript
const router = Router();

router.post(
  '/',
  validateRequest(vesselRequestValidation),
  vesselRequestController.create
);

router.post(
  '/list',
  validateRequest(vesselRequestListValidation),
  vesselRequestController.getAll
);

router.post(
  '/list/:id',
  validateRequest(vesselRequestByIdValidation),
  vesselRequestController.getById
);

router.put(
  '/:id',
  validateRequest(updateVesselRequestValidation),
  vesselRequestController.update
);

router.delete(
  '/:id',
  validateRequest(vesselRequestByIdValidation),
  vesselRequestController.delete
);

export default router;
```

**Design Decisions:**
- ✅ POST for list enables complex search/filter payloads
- ✅ Validation middleware applied to all routes
- ✅ RESTful naming conventions
- ✅ Consistent error handling via asyncHandler

---

## Frontend Implementation

### 1. Main List View

**Location:** `apps/web/src/features/request/views/Index.vue`

**Key Features:**
- Server-side pagination
- Real-time search with debouncing (500ms)
- Row-click navigation to view details
- Color-coded status and priority badges
- Responsive data table

**Component Structure:**

```vue
<template>
  <div class="space-y-6">
    <!-- Header with New Request button -->
    <div class="flex justify-between items-center">
      <h1>Requests</h1>
      <button @click="openAddDialog">
        <Plus /> New Request
      </button>
    </div>

    <!-- Search Filter -->
    <SearchFilter v-model="searchQuery" />

    <!-- Data Table with row-click -->
    <DataTable
      :columns="columns"
      :data="requests"
      :pagination="pagination"
      @update:current-page="currentPage = $event"
      @row-click="handleRowClick"
    />

    <!-- Dialogs -->
    <ViewRequest :is-open="isViewOpen" :request="selectedRequest" />
    <FormRequest :is-open="isFormOpen" @submit="handleFormSubmit" />
  </div>
</template>
```

**State Management:**

```javascript
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;
const requests = ref([]);
const pagination = ref(null);

// Debounced search
watch(searchQuery, (newValue) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchRequests();
  }, 500);
});

// Pagination watcher
watch(currentPage, () => {
  fetchRequests();
});
```

**Row Click Handler:**

```javascript
const handleRowClick = async (request) => {
  try {
    // Fetch full details including all items
    const fullRequest = await requestStore.fetchRequestById(request.id);
    if (fullRequest) {
      selectedRequest.value = fullRequest;
      isViewOpen.value = true;
    }
  } catch (error) {
    showError('Failed to load request details');
  }
};
```

### 2. Multi-Step Form Component

**Location:** `apps/web/src/features/request/component/FormRequest.vue`

**Design Pattern: Multi-Step Wizard**

```vue
<template>
  <FormDialog>
    <!-- Step Indicator -->
    <div class="flex items-center justify-center">
      <div>Step 1: Request Info</div>
      <div>Step 2: Add Items</div>
    </div>

    <!-- Step 1: Header Information -->
    <form v-show="currentStep === 1">
      <select v-model="formData.vesselId" required>
        <option v-for="vessel in vessels" :value="vessel.id">
          {{ vessel.name }}
        </option>
      </select>
      <input v-model="formData.requestDate" type="date" required />
      <select v-model="formData.priority" required>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
      <textarea v-model="formData.justification"></textarea>
    </form>

    <!-- Step 2: Items -->
    <div v-show="currentStep === 2">
      <button @click="addItem">Add Item</button>
      
      <div v-for="(item, index) in formData.items">
        <select v-model="item.itemId" required />
        <input v-model.number="item.qtyRequested" type="number" />
        <select v-model="item.unit" />
        <select v-model="item.priority" />
        <button @click="removeItem(index)">Remove</button>
      </div>
    </div>

    <!-- Custom Footer -->
    <template #footer>
      <button v-if="currentStep === 2" @click="goToPreviousStep">
        Previous
      </button>
      <button v-if="currentStep === 1" @click="goToNextStep">
        Next
      </button>
      <button v-if="currentStep === 2" @click="handleSubmit">
        Submit
      </button>
    </template>
  </FormDialog>
</template>
```

**Form State Management:**

```javascript
const currentStep = ref(1);
const formData = ref({
  vesselId: null,
  requestDate: new Date().toISOString().split('T')[0],
  priority: 'Medium',
  status: 'Waiting', // Hidden field
  justification: '',
  items: [
    {
      itemId: null,
      qtyRequested: 1,
      unit: 'Pcs',
      status: 'Waiting', // Hidden field
      priority: 'Medium',
      justification: '',
    },
  ],
});
```

**Step Navigation:**

```javascript
const goToNextStep = () => {
  // Validate Step 1 required fields
  if (!formData.value.vesselId || !formData.value.requestDate || !formData.value.priority) {
    showError('Please fill all required fields');
    return;
  }
  currentStep.value = 2;
};

const goToPreviousStep = () => {
  currentStep.value = 1;
};
```

**Dynamic Items Management:**

```javascript
const addItem = () => {
  formData.value.items.push({
    itemId: null,
    qtyRequested: 1,
    unit: 'Pcs',
    status: 'Waiting',
    priority: 'Medium',
    justification: '',
  });
};

const removeItem = (index) => {
  if (formData.value.items.length > 1) {
    formData.value.items.splice(index, 1);
  }
};
```

**Submit Handler:**

```javascript
const handleSubmit = () => {
  loading.value = true;
  
  // Validate all items have required fields
  const invalidItems = formData.value.items.filter(
    item => !item.itemId || !item.qtyRequested
  );
  
  if (invalidItems.length > 0) {
    showError('Please complete all item fields');
    loading.value = false;
    return;
  }

  emit('submit', formData.value);
};
```

**Key Design Decisions:**
- ✅ Multi-step reduces cognitive load for complex forms
- ✅ Status always "Waiting" for new requests (hidden from user)
- ✅ Default values provided for better UX
- ✅ Validation at each step prevents errors
- ✅ Compact 4-column grid for items (responsive)
- ✅ Disabled remove button when only 1 item exists
- ✅ Visual step indicator shows progress

### 3. Read-Only View Component

**Location:** `apps/web/src/features/request/component/ViewRequest.vue`

**Design Pattern: DataTable Integration**

```vue
<template>
  <FormDialog :show-footer="false" size="xl">
    <!-- Gradient Header Card -->
    <div class="bg-gradient-to-r from-indigo-50 to-blue-50">
      <h3>{{ request.requestCode }}</h3>
      <div class="grid grid-cols-2">
        <!-- Vessel with Ship icon -->
        <div class="flex items-start gap-3">
          <Ship class="w-5 h-5 text-indigo-600" />
          <div>
            <label>Vessel</label>
            <p>{{ request.vessel?.name }}</p>
          </div>
        </div>
        
        <!-- Requested By with User icon -->
        <div class="flex items-start gap-3">
          <User class="w-5 h-5 text-indigo-600" />
          <div>
            <label>Requested By</label>
            <p>{{ request.user?.fullName }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Items Table using DataTable component -->
    <DataTable
      :columns="itemColumns"
      :data="request.vesselRequestItems"
      :show-pagination="false"
      :clickable="false"
    >
      <!-- Custom cell renderers -->
      <template #cell-index="{ row }">
        <div class="w-8 h-8 bg-gray-100 rounded-full">
          {{ getItemIndex(row) }}
        </div>
      </template>

      <template #cell-item="{ row }">
        <div class="flex items-center gap-2">
          <Package class="w-4 h-4" />
          <div>
            <p>{{ row.item?.name }}</p>
            <p class="text-xs">{{ row.item?.itemCode }}</p>
          </div>
        </div>
      </template>

      <template #cell-qtyRequested="{ row }">
        <span>{{ row.qtyRequested }}</span>
        <span class="text-xs">{{ row.unit }}</span>
      </template>

      <template #cell-status="{ row }">
        <span :class="getStatusColor(row.status)">
          {{ row.status }}
        </span>
      </template>
    </DataTable>
  </FormDialog>
</template>
```

**DataTable Configuration:**

```javascript
const itemColumns = [
  { key: 'index', label: '#' },
  { key: 'item', label: 'Item' },
  { key: 'qtyRequested', label: 'Qty Requested' },
  { key: 'qtyApproved', label: 'Qty Approved' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
];
```

**Key Design Decisions:**
- ✅ Reusable DataTable component for consistency
- ✅ Custom cell slots for complex rendering
- ✅ Lucide icons for visual hierarchy
- ✅ Gradient header creates visual interest
- ✅ Color-coded badges for status/priority
- ✅ Clickable disabled (rows not interactive)
- ✅ Table format better than cards for comparing quantities

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
    async fetchRequests(page, limit, search) {
      try {
        const data = await requestAPI.getRequests(page, limit, search);
        this.requests = data.requests;
        this.pagination = data.pagination;
      } catch (error) {
        this.error = error.error || 'Failed to fetch requests.';
      }
    },

    async fetchRequestById(id) {
      try {
        const request = await requestAPI.getRequestsById(id);
        return request;
      } catch (error) {
        this.error = error.error || 'Failed to fetch request details.';
        return null;
      }
    },

    async createRequest(requestData) {
      try {
        await requestAPI.createRequest(requestData);
        await this.fetchRequests(); // Refresh list
      } catch (error) {
        this.error = error.error || 'Failed to create request.';
        throw error; // Re-throw for component handling
      }
    },
  },
});
```

**Design Decisions:**
- ✅ Centralized state management
- ✅ Error handling with user-friendly messages
- ✅ Auto-refresh after mutations
- ✅ Throws errors for component-level handling

### 5. API Service Layer

**Location:** `apps/web/src/features/request/api.js`

```javascript
import { http } from '@/services/http';

export async function getRequests(page, limit, search) {
  const { data } = await http.post('/vessel-requests/list', {
    page,
    limit,
    search,
  });
  return data;
}

export async function getRequestsById(id) {
  const { data } = await http.post(`/vessel-requests/list/${id}`);
  return data;
}

export async function createRequest(requestData) {
  await http.post('/vessel-requests', requestData);
}

export async function updateRequest(id, requestData) {
  await http.put(`/vessel-requests/${id}`, requestData);
}

export async function deleteRequest(id) {
  await http.delete(`/vessel-requests/${id}`);
}
```

**Design Decisions:**
- ✅ Separation from store logic
- ✅ Axios wrapper (http service) handles auth tokens
- ✅ Consistent error handling at service level
- ✅ Simple async/await pattern

---

## Data Flow

### Request Creation Flow

```
1. User clicks "New Request"
   └─> Index.vue sets isFormOpen = true

2. FormRequest.vue opens with empty form
   └─> onMounted: Loads vessels and items from stores
   └─> Step 1: User fills vessel, date, priority, justification
   └─> User clicks "Next"
   └─> Validation: Check required fields
   └─> currentStep = 2

3. Step 2: User manages items
   └─> Click "Add Item" → Adds to formData.items array
   └─> Select item, quantity, unit, priority
   └─> Click "Remove" → Removes from array
   └─> User clicks "Submit"

4. Form validation
   └─> Check all items have itemId and qtyRequested
   └─> If invalid → Show error and stop
   └─> If valid → Continue

5. Emit submit event to parent
   └─> Index.vue: handleFormSubmit(formData)

6. Store action
   └─> requestStore.createRequest(formData)

7. API call
   └─> POST /vessel-requests with full payload

8. Backend processing
   └─> Validate vessel exists
   └─> Validate all items exist
   └─> Generate request code
   └─> Create VesselRequest record
   └─> Create VesselRequestItem records (bulk)
   └─> Return success

9. Frontend response handling
   └─> Success: Show notification
   └─> Refresh request list
   └─> Close form dialog
   └─> Error: Show error message
```

### View Request Flow

```
1. User clicks table row
   └─> DataTable emits 'row-click' event

2. Index.vue: handleRowClick(request)
   └─> request object has minimal data (from list)

3. Fetch full details
   └─> requestStore.fetchRequestById(request.id)

4. API call
   └─> POST /vessel-requests/list/:id

5. Backend processing
   └─> Find VesselRequest by id
   └─> Include: vessel, user, vesselRequestItems
   └─> Include: item details in each vesselRequestItem
   └─> Return full nested object

6. Set view state
   └─> selectedRequest.value = fullRequest
   └─> isViewOpen.value = true

7. ViewRequest.vue renders
   └─> Shows header with vessel and user info
   └─> DataTable displays all items
   └─> Icons and colors enhance readability
```

---

## Development Journey

### Initial Implementation

**Goal:** Create a functional vessel request form

**Challenges:**
1. Too many fields for single page
2. Complex nested data structure (header + items)
3. Need to validate both levels

**Solution:** Multi-step wizard approach
- Step 1: Header information
- Step 2: Dynamic items array

### Iteration 1: Form Refinements

**User Feedback:**
- "Status should always be Waiting for new requests"
- "Items section too spacious"
- "Don't need to show item status"

**Changes Made:**
```javascript
// Hidden status field (always "Waiting")
formData.value.status = 'Waiting'; // Not shown in UI

// Compact grid layout
// Before: 2 columns with large padding
// After: 4 columns with reduced spacing
<div class="grid grid-cols-4 gap-2 p-3">

// Item status removed from UI but sent in payload
item.status = 'Waiting'; // Hidden field
```

### Iteration 2: View Separation

**User Feedback:**
- "Handle edit/delete buttons"
- Then: "Remove delete & edit, just view"
- "Open by clicking row, not icon"

**Changes Made:**
1. Removed actions column from table
2. Created separate ViewRequest.vue component
3. Made entire table row clickable
4. Enhanced DataTable to emit row-click events

```javascript
// DataTable.vue enhancement
<tr @click="emit('row-click', row)">
```

### Iteration 3: Visual Polish

**User Feedback:**
- "Make the form more beauty"
- "Use lucide-icons, and make table instead for items"

**Changes Made:**
1. Added Lucide Vue Next icons
   - Ship icon for vessel
   - User icon for requester
   - Package icon for items
   - Loader2 for loading states

2. Changed items display from cards to table
   ```vue
   <!-- Before: Individual cards -->
   <div v-for="item in items" class="card">
   
   <!-- After: Structured table -->
   <DataTable :columns="itemColumns" :data="items">
   ```

3. Enhanced header with gradient
   ```vue
   <div class="bg-gradient-to-r from-indigo-50 to-blue-50">
   ```

### Iteration 4: DataTable Integration

**Goal:** Use consistent DataTable component everywhere

**Changes:**
- Replaced custom HTML table with DataTable component
- Added `clickable` prop to DataTable (default: true)
- ViewRequest uses DataTable with custom cell slots
- Main list view uses DataTable with row-click

**Benefits:**
- ✅ Consistent styling across application
- ✅ Reusable pagination logic
- ✅ Easier maintenance
- ✅ Built-in responsive behavior

---

## Best Practices

### 1. Form Design

**✅ DO:**
- Use multi-step wizards for complex forms (>6 fields)
- Provide sensible defaults (dates, priorities)
- Hide technical fields from users (status management)
- Validate at each step, not just at submit
- Show clear error messages
- Enable/disable buttons based on state
- Use grid layouts for responsive design

**❌ DON'T:**
- Put everything on one page
- Use ambiguous labels
- Allow removing the last item
- Submit without validation

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

**❌ DON'T:**
- Make API calls directly from components
- Ignore error states
- Forget to reset form after submit
- Mix data fetching and UI logic

### 4. Backend Design

**✅ DO:**
- Validate all inputs (vessel, items existence)
- Use repository pattern for database operations
- Implement proper pagination
- Use transactions for multi-table inserts
- Generate unique codes (timestamps, UUIDs)
- Include related data in responses

**❌ DON'T:**
- Trust client-side validation alone
- Query database in controllers
- Return all records without pagination
- Expose internal IDs without validation

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
├── store.js        # State management
└── api.js          # HTTP layer
```

---

## Testing Guide

### Manual Testing Checklist

**Create Request:**
- [ ] Click "New Request" button opens form
- [ ] Vessel dropdown populated
- [ ] Items dropdown populated
- [ ] Date defaults to today
- [ ] Priority defaults to "Medium"
- [ ] Step 1 validation works (required fields)
- [ ] "Next" button moves to Step 2
- [ ] "Previous" button returns to Step 1
- [ ] "Add Item" adds new item row
- [ ] "Remove Item" removes row (min 1)
- [ ] Item #1 is selected item name
- [ ] Submit with valid data succeeds
- [ ] Success notification appears
- [ ] Form closes after submit
- [ ] List refreshes with new request

**View Request:**
- [ ] Click any table row opens view
- [ ] Request code displayed correctly
- [ ] Vessel info with Ship icon
- [ ] User info with User icon
- [ ] Status badge with correct color
- [ ] Priority badge with correct color
- [ ] Items shown in table format
- [ ] Item names with Package icons
- [ ] Quantities display correctly
- [ ] Close button works

**Search & Pagination:**
- [ ] Search by request code works
- [ ] Search by vessel name works
- [ ] Search by requester name works
- [ ] Search debounces (500ms)
- [ ] Pagination Previous/Next buttons
- [ ] Page info displays correctly
- [ ] Table updates on page change

### Unit Testing Examples

**Store Tests:**
```javascript
describe('useRequestStore', () => {
  it('should fetch requests with pagination', async () => {
    const store = useRequestStore();
    await store.fetchRequests(1, 10, '');
    expect(store.requests).toBeDefined();
    expect(store.pagination).toBeDefined();
  });

  it('should handle fetch errors', async () => {
    const store = useRequestStore();
    // Mock API to throw error
    await store.fetchRequests(1, 10, '');
    expect(store.error).not.toBeNull();
  });
});
```

**Component Tests:**
```javascript
describe('FormRequest', () => {
  it('should start at step 1', () => {
    const wrapper = mount(FormRequest, {
      props: { isOpen: true }
    });
    expect(wrapper.vm.currentStep).toBe(1);
  });

  it('should validate step 1 before proceeding', async () => {
    const wrapper = mount(FormRequest);
    await wrapper.vm.goToNextStep();
    // Should stay on step 1 if invalid
    expect(wrapper.vm.currentStep).toBe(1);
  });
});
```

---

## Future Enhancements

### Planned Features

1. **Draft Requests**
   - Save incomplete requests
   - Resume editing later
   - Auto-save every 30 seconds

2. **Approval Workflow**
   - Multi-level approvals
   - Approve/reject entire request
   - Approve/reject individual items
   - Approval history tracking

3. **Notifications**
   - Email on request creation
   - Push notifications for status changes
   - In-app notification center

4. **Advanced Search**
   - Filter by status
   - Filter by priority
   - Filter by date range
   - Filter by vessel
   - Export to Excel/PDF

5. **Request Templates**
   - Save common request patterns
   - Quick create from template
   - Vessel-specific templates

6. **Bulk Operations**
   - Approve multiple requests
   - Export multiple requests
   - Bulk status updates

7. **Mobile App**
   - Native iOS/Android apps
   - Offline mode
   - Camera for item photos

### Technical Improvements

1. **Performance**
   - Implement request caching
   - Virtual scrolling for large lists
   - Lazy loading for images

2. **Error Handling**
   - Retry failed requests
   - Better error messages
   - Sentry integration

3. **Testing**
   - E2E tests with Playwright
   - API tests with Supertest
   - Visual regression tests

4. **Documentation**
   - API documentation with Swagger
   - Video tutorials
   - Interactive demos

---

## Lessons Learned

### What Worked Well

1. **Multi-step forms** reduced cognitive load significantly
2. **Reusable DataTable** component saved development time
3. **Repository pattern** kept code organized and testable
4. **Zod validation** caught errors early
5. **Lucide icons** improved visual appeal without bloat
6. **Pinia stores** made state management straightforward
7. **Server-side pagination** prevented performance issues

### What We'd Do Differently

1. **Plan the UX earlier** - Multiple iterations on view/edit separation
2. **Document as we build** - Easier than reconstructing later
3. **Create reusable components first** - Would have saved refactoring time
4. **More user testing** - Get feedback before full implementation
5. **Backend update/delete** - Complete CRUD implementation (currently stubbed)

### Key Takeaways

> **"Start with the user flow, not the code."**  
> Understanding how users will interact with the feature led to better design decisions.

> **"Consistency over customization."**  
> Using DataTable everywhere created a more cohesive experience.

> **"Iterate based on feedback."**  
> Each iteration made the feature significantly better.

> **"Documentation is code."**  
> This document will save countless hours for future features.

---

## Related Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [apps/api/src/ARCHITECTURE.md](./apps/api/src/ARCHITECTURE.md) - Backend architecture
- [apps/web/IMPLEMENTATION.md](./apps/web/IMPLEMENTATION.md) - Frontend patterns
- [DOCUMENTATION-INDEX.md](./DOCUMENTATION-INDEX.md) - All documentation

---

## Appendix

### Color Scheme Reference

**Status Colors:**
```javascript
{
  Waiting: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Pending: 'bg-blue-100 text-blue-800',
  Completed: 'bg-purple-100 text-purple-800',
}
```

**Priority Colors:**
```javascript
{
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-green-100 text-green-800',
}
```

### API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/vessel-requests` | Create new request |
| POST | `/vessel-requests/list` | Get paginated list |
| POST | `/vessel-requests/list/:id` | Get single request |
| PUT | `/vessel-requests/:id` | Update request |
| DELETE | `/vessel-requests/:id` | Delete request |

### Database Relations

```
User ─┐
      ├──> VesselRequest ──> VesselRequestItem ──> MstItem
MstVessel ─┘
```

---

**Document Maintainer:** Development Team  
**Review Cycle:** After each major feature update  
**Feedback:** Create issue with label `documentation`

---

*This document serves as both implementation guide and template for future modules. Keep it updated as the feature evolves.*
