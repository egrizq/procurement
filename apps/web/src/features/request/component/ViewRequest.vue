<template>
  <FormDialog
    :is-open="isOpen"
    title="Request Details"
    :show-footer="false"
    size="xl"
    @close="handleClose"
  >
    <template #default>
      <div v-if="request" class="space-y-6">
        <!-- Request Header Card -->
        <div class="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-100">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-2xl font-bold text-gray-900">{{ request.requestCode }}</h3>
              <p class="text-sm text-gray-600 mt-1">
                Created on {{ formatDate(request.requestDate) }}
              </p>
            </div>
            <div class="flex gap-2">
              <span
                class="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm"
                :class="getStatusColor(request.status)"
              >
                {{ request.status }}
              </span>
              <span
                class="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm"
                :class="getPriorityColor(request.priority)"
              >
                {{ request.priority }} Priority
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Vessel -->
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Ship class="w-5 h-5 text-indigo-600" />
              </div>
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Vessel</label>
                <p class="text-base font-semibold text-gray-900">{{ request.vessel?.name }}</p>
                <p class="text-sm text-gray-600">{{ request.vessel?.imoNumber }}</p>
              </div>
            </div>

            <!-- Requested By -->
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <User class="w-5 h-5 text-indigo-600" />
              </div>
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Requested By</label>
                <p class="text-base font-semibold text-gray-900">{{ request.user?.fullName }}</p>
              </div>
            </div>
          </div>

          <!-- Justification -->
          <div v-if="request.justification" class="mt-6 pt-6 border-t border-indigo-200">
            <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Justification</label>
            <p class="text-base text-gray-700 leading-relaxed">
              {{ request.justification }}
            </p>
          </div>
        </div>

        <!-- Request Items Table -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900">Request Items</h3>
            <span class="text-sm font-medium text-gray-500">
              {{ request.vesselRequestItems?.length || 0 }} item(s)
            </span>
          </div>

          <DataTable
            v-if="request.vesselRequestItems && request.vesselRequestItems.length > 0"
            :columns="itemColumns"
            :data="request.vesselRequestItems"
            :show-pagination="false"
            :clickable="false"
            row-key="id"
          >
            <!-- Index Column -->
            <template #cell-index="{ row }">
              <div class="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                <span class="text-sm font-bold text-gray-600">{{ getItemIndex(row) }}</span>
              </div>
            </template>

            <!-- Item Column -->
            <template #cell-item="{ row }">
              <div class="flex items-center gap-2">
                <Package class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p class="text-sm font-semibold text-gray-900">{{ row.item?.name }}</p>
                  <p class="text-xs text-gray-500">{{ row.item?.itemCode }}</p>
                </div>
              </div>
            </template>

            <!-- Qty Requested Column -->
            <template #cell-qtyRequested="{ row }">
              <div class="flex items-center gap-1">
                <span class="text-sm font-semibold text-blue-900">{{ row.qtyRequested }}</span>
                <span class="text-xs text-gray-500">{{ row.unit }}</span>
              </div>
            </template>

            <!-- Qty Approved Column -->
            <template #cell-qtyApproved="{ row }">
              <div v-if="row.qtyApproved" class="flex items-center gap-1">
                <span class="text-sm font-semibold text-green-900">{{ row.qtyApproved }}</span>
                <span class="text-xs text-gray-500">{{ row.unit }}</span>
              </div>
              <span v-else class="text-sm text-gray-400">-</span>
            </template>

            <!-- Status Column -->
            <template #cell-status="{ row }">
              <span
                class="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full"
                :class="getStatusColor(row.status)"
              >
                {{ row.status }}
              </span>
            </template>

            <!-- Priority Column -->
            <template #cell-priority="{ row }">
              <span
                class="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full"
                :class="getPriorityColor(row.priority)"
              >
                {{ row.priority }}
              </span>
            </template>
          </DataTable>

          <!-- No items -->
          <div v-else class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <PackageX class="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p class="text-gray-500 font-medium">No items in this request</p>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-else class="text-center py-16">
        <Loader2 class="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
        <p class="text-lg font-medium text-gray-700">Loading request details...</p>
        <p class="text-sm text-gray-500 mt-1">Please wait a moment</p>
      </div>
    </template>
  </FormDialog>
</template>

<script setup>
import { computed } from 'vue'
import { Ship, User, Package, PackageX, Loader2 } from 'lucide-vue-next'
import FormDialog from '@/components/base/form/Form.vue'
import DataTable from '@/components/base/data-table/DataTable.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  request: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close'])

// Define columns for items table
const itemColumns = [
  { key: 'index', label: '#' },
  { key: 'item', label: 'Item' },
  { key: 'qtyRequested', label: 'Qty Requested' },
  { key: 'qtyApproved', label: 'Qty Approved' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
]

// Helper to get item index
const getItemIndex = (item) => {
  return props.request.vesselRequestItems.findIndex(i => i.id === item.id) + 1
}

const handleClose = () => {
  emit('close')
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const getStatusColor = (status) => {
  const colors = {
    Waiting: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    Approved: 'bg-green-100 text-green-800 border border-green-200',
    Rejected: 'bg-red-100 text-red-800 border border-red-200',
    Pending: 'bg-blue-100 text-blue-800 border border-blue-200',
    Completed: 'bg-purple-100 text-purple-800 border border-purple-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border border-gray-200'
}

const getPriorityColor = (priority) => {
  const colors = {
    High: 'bg-red-100 text-red-800 border border-red-200',
    Medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    Low: 'bg-green-100 text-green-800 border border-green-200',
  }
  return colors[priority] || 'bg-gray-100 text-gray-800 border border-gray-200'
}
</script>
