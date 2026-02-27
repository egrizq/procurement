import { defineStore } from 'pinia'
import * as apiMasterVessel from './api.js'

export const useVesselStore = defineStore('vessel', {
  state: () => ({
    vessels: [],
    pagination: {},
    error: null,
  }),
  actions: {
    async fetchVessels(page, limit, search) {
      try {
        const response = await apiMasterVessel.getMstVessels(page, limit, search)
        this.vessels = response.vessels
        this.pagination = response.pagination
      } catch (error) {
        this.error = error.error
      }
    },
    clearError() {
      this.error = null
    },
  },
})
