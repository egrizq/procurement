import { defineStore } from 'pinia'
import * as requestAPI from '../request/api'

export const useMocStore = defineStore('moc', {
  state: () => ({
    requests: [],
    pagination: {},
    error: null,
  }),
  actions: {
    async fetchApprovedRequests(page, limit, search) {
      try {
        const data = await requestAPI.getRequests(page, limit, search, 'Approved')
        this.requests = data.requests
        this.pagination = data.pagination
      } catch (error) {
        this.error = error.error || 'Failed to fetch approved requests.'
      }
    },
    clearError() {
      this.error = null
    },
  },
})