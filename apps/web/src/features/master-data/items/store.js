import { defineStore } from 'pinia'
import * as apiMasterVendor from './api.js'

export const useItemStore = defineStore('item', {
  state: () => ({
    items: [],
    pagination: {},
    error: null,
  }),
  actions: {
    async fetchItems(page, limit, search) {
      try {
        const response = await apiMasterVendor.getMstItems(page, limit, search)
        this.items = response.items
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
