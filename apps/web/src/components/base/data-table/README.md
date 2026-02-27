# Reusable Table Components

This document explains how to use the new reusable `SearchFilter` and `DataTable` components.

## Components

### SearchFilter Component

Located at: `src/components/base/SearchFilter.vue`

A reusable search and filter component with a search input and customizable filter slots.

**Props:**

- `modelValue` (String): The search query value
- `placeholder` (String, default: 'Search...'): Placeholder text for search input

**Events:**

- `update:modelValue`: Emitted when search input changes

**Slots:**

- `filters`: Slot for custom filter elements (dropdowns, etc.)

**Example Usage:**

```vue
<SearchFilter v-model="searchQuery" placeholder="Search items...">
  <template #filters>
    <select v-model="filterCategory" class="px-4 py-2 border border-gray-300 rounded-lg">
      <option value="">All Categories</option>
      <option value="electronics">Electronics</option>
      <option value="mechanical">Mechanical</option>
    </select>
  </template>
</SearchFilter>
```

### DataTable Component

Located at: `src/components/base/DataTable.vue`

A flexible data table component with pagination, custom cell rendering, and responsive design.

**Props:**

- `columns` (Array, required): Array of column configurations
  - `key` (String): The data key to display (supports nested properties with dot notation, e.g., 'category.name')
  - `label` (String): Column header label
  - `cellClass` (String, optional): Additional CSS classes for cells
- `data` (Array, required): Array of data objects to display
- `rowKey` (String, default: 'id'): Unique key field for rows
- `currentPage` (Number, default: 1): Current page number
- `itemsPerPage` (Number, default: 10): Items per page
- `showPagination` (Boolean, default: true): Show/hide pagination

**Events:**

- `update:currentPage`: Emitted when page changes

**Slots:**

- `cell-{columnKey}`: Custom cell rendering for specific columns
  - Props available: `row` (full row data), `value` (cell value)

**Example Usage:**

```vue
<template>
  <DataTable
    :columns="columns"
    :data="filteredData"
    :current-page="currentPage"
    :items-per-page="10"
    @update:current-page="currentPage = $event"
  >
    <!-- Custom cell for status column -->
    <template #cell-status="{ row }">
      <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        {{ row.status }}
      </span>
    </template>

    <!-- Custom cell for actions column -->
    <template #cell-actions="{ row }">
      <div class="flex items-center gap-2">
        <button @click="editItem(row)" class="p-1 text-indigo-600">
          <Edit :size="16" />
        </button>
        <button @click="deleteItem(row)" class="p-1 text-red-600">
          <Trash2 :size="16" />
        </button>
      </div>
    </template>
  </DataTable>
</template>

<script setup>
import { ref } from 'vue'
import DataTable from '@/components/base/DataTable.vue'

const currentPage = ref(1)

const columns = [
  { key: 'code', label: 'Code', cellClass: 'font-medium text-gray-900' },
  { key: 'name', label: 'Name', cellClass: 'text-gray-900' },
  { key: 'category.name', label: 'Category' }, // Nested property support
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

const data = ref([
  { id: 1, code: 'ITM-001', name: 'Item 1', category: { name: 'Electronics' }, status: 'Active' },
  { id: 2, code: 'ITM-002', name: 'Item 2', category: { name: 'Mechanical' }, status: 'Inactive' },
])
</script>
```

## Complete Example: Items View

See `src/features/master-data/views/Items.vue` for a complete working example that demonstrates:

1. **Search and Filter Integration**
   - Search input with real-time filtering
   - Category dropdown filter
   - Combined filtering logic

2. **Data Table with Custom Cells**
   - Badge-styled category cells with color coding
   - Badge-styled status cells with color coding
   - Action buttons (Edit, View, Delete) with icons

3. **Pagination**
   - Automatic pagination with page controls
   - Showing X to Y of Z results text
   - Disabled states for Previous/Next buttons

## Key Features

✅ **Reusable** - Use across multiple views with consistent design
✅ **Flexible** - Customize cells with slots
✅ **Nested Properties** - Access nested object properties using dot notation (e.g., 'category.name')
✅ **Responsive** - Mobile-friendly with horizontal scroll
✅ **Accessible** - Proper ARIA labels and semantic HTML
✅ **Styled** - Pre-styled with Tailwind CSS matching project design
✅ **Pagination** - Built-in pagination support
✅ **Type-safe** - Clear prop definitions and events

## Design Consistency

Both components maintain the exact same visual design as before:

- White background with shadow
- Rounded corners
- Indigo focus rings
- Gray color scheme
- Hover effects
- Responsive layout
