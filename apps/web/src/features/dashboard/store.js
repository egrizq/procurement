import { defineStore } from 'pinia'
import * as dashboardAPI from './api'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    stats: {
      totalItems: 0,
      activeVendors: 0,
      activeVessels: 0,
      pendingRequests: 0,
    },
    recentActivity: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchStats() {
      this.loading = true
      try {
        const data = await dashboardAPI.getDashboardStats()
        this.stats = data.stats
        this.recentActivity = data.recentActivity
      } catch (error) {
        this.error = error.error || 'Failed to fetch dashboard stats.'
      } finally {
        this.loading = false
      }
    },
  },
})
