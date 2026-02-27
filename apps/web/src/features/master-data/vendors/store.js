import { defineStore } from 'pinia'
import * as apiMasterVendor from './api.js'

export const useVendorStore = defineStore('vendor', {
  state: () => ({
    vendors: [],
    pagination: {},
    error: null,
  }),
  actions: {
    async fetchVendors(page, limit, search) {
      try {
        const response = await apiMasterVendor.getMstVendors(page, limit, search)
        this.vendors = response.vendors
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
