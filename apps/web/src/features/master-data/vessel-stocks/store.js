import { defineStore } from 'pinia'
import * as apiVesselStock from './api.js'

export const useVesselStockStore = defineStore('vesselStock', {
  state: () => ({
    items: [],
    pagination: {},
    error: null,
  }),
  actions: {
    async fetchVesselStocks(page, limit, search) {
      try {
        const response = await apiVesselStock.getMstVesselStocks(page, limit, search)
        this.items = response.items
        this.pagination = response.pagination
        this.error = null
      } catch (error) {
        this.error = error.error
        this.items = []
        this.pagination = {}
      }
    },
    async createVesselStock(stockData) {
      try {
        await apiVesselStock.createVesselStock(stockData)
        this.error = null
      } catch (error) {
        this.error = error.error || 'Failed to create vessel stock'
        throw error
      }
    },
    async updateVesselStock(id, stockData) {
      try {
        await apiVesselStock.updateVesselStock(id, stockData)
        this.error = null
      } catch (error) {
        this.error = error.error || 'Failed to update vessel stock'
        throw error
      }
    },
    async deleteVesselStock(id) {
      try {
        await apiVesselStock.deleteVesselStock(id)
        this.error = null
      } catch (error) {
        this.error = error.error || 'Failed to delete vessel stock'
        throw error
      }
    },
    clearError() {
      this.error = null
    },
  },
})
