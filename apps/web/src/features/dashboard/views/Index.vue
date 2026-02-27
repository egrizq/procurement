<template>
  <div class="space-y-6">
    <!-- Welcome Header -->
    <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
      <h1 class="text-4xl font-bold mb-2">Welcome to Procurement ERP</h1>
      <p class="text-indigo-100 text-lg">Streamline your vessel procurement operations</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm font-medium">Total Items</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">1,245</p>
          </div>
          <div class="p-3 bg-blue-100 rounded-lg">
            <Package class="text-blue-600" :size="24" />
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm">
          <TrendingUp class="text-green-500 mr-1" :size="16" />
          <span class="text-green-500 font-medium">12%</span>
          <span class="text-gray-600 ml-1">vs last month</span>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm font-medium">Active Vendors</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">85</p>
          </div>
          <div class="p-3 bg-purple-100 rounded-lg">
            <Building class="text-purple-600" :size="24" />
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm">
          <TrendingUp class="text-green-500 mr-1" :size="16" />
          <span class="text-green-500 font-medium">8%</span>
          <span class="text-gray-600 ml-1">vs last month</span>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm font-medium">Pending Requests</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">23</p>
          </div>
          <div class="p-3 bg-yellow-100 rounded-lg">
            <FileText class="text-yellow-600" :size="24" />
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm">
          <TrendingDown class="text-red-500 mr-1" :size="16" />
          <span class="text-red-500 font-medium">5%</span>
          <span class="text-gray-600 ml-1">vs last month</span>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm font-medium">Active Vessels</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">12</p>
          </div>
          <div class="p-3 bg-green-100 rounded-lg">
            <Ship class="text-green-600" :size="24" />
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm">
          <span class="text-gray-600">All vessels operational</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <router-link
          to="/request"
          class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
        >
          <div class="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
            <FileText class="text-indigo-600" :size="20" />
          </div>
          <div>
            <p class="font-medium text-gray-900">Create Request</p>
            <p class="text-sm text-gray-600">Submit new procurement request</p>
          </div>
        </router-link>

        <router-link
          to="/master-data/items"
          class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
        >
          <div class="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
            <Package class="text-purple-600" :size="20" />
          </div>
          <div>
            <p class="font-medium text-gray-900">Manage Items</p>
            <p class="text-sm text-gray-600">View and edit items</p>
          </div>
        </router-link>

        <router-link
          to="/purchase-order"
          class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
        >
          <div class="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
            <ShoppingCart class="text-green-600" :size="20" />
          </div>
          <div>
            <p class="font-medium text-gray-900">Purchase Orders</p>
            <p class="text-sm text-gray-600">View active orders</p>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
      <div class="space-y-4">
        <div class="flex items-start gap-3 pb-4 border-b border-gray-100">
          <div class="p-2 bg-blue-100 rounded-lg">
            <FileText class="text-blue-600" :size="16" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900">
              New request submitted from MV Ocean Star
            </p>
            <p class="text-xs text-gray-600 mt-1">2 hours ago</p>
          </div>
        </div>

        <div class="flex items-start gap-3 pb-4 border-b border-gray-100">
          <div class="p-2 bg-green-100 rounded-lg">
            <ShoppingCart class="text-green-600" :size="16" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900">Purchase order PO-2026-045 approved</p>
            <p class="text-xs text-gray-600 mt-1">5 hours ago</p>
          </div>
        </div>

        <div class="flex items-start gap-3 pb-4 border-b border-gray-100">
          <div class="p-2 bg-purple-100 rounded-lg">
            <Building class="text-purple-600" :size="16" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900">
              New vendor registered: Marine Solutions Ltd.
            </p>
            <p class="text-xs text-gray-600 mt-1">1 day ago</p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="p-2 bg-yellow-100 rounded-lg">
            <ClipboardCheck class="text-yellow-600" :size="16" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900">Good receipt GR-2026-123 completed</p>
            <p class="text-xs text-gray-600 mt-1">1 day ago</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Package,
  Building,
  FileText,
  Ship,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  ClipboardCheck,
} from 'lucide-vue-next'
</script>
