import { defineStore } from 'pinia'
import * as apiVessel from './api.js'

export const useVesselStore = defineStore('vessel', {
  state: () => ({
    vessels: [],
    pagination: {},
    error: null,
  }),
  actions: {
    async fetchVessels(page = 1, limit = 10, search = '') {
      try {
        const response = await apiVessel.getMstVessels(page, limit, search)
        this.vessels = response.data || response.vessels || []
        this.pagination = response.pagination || {}
        this.error = null
      } catch (error) {
        this.error = error.message || 'Failed to fetch vessels'
      }
    },
    clearError() {
      this.error = null
    },
  },
})
