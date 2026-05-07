import { defineStore } from 'pinia'
import * as apiVesselItemStandard from './api.js'

export const useVesselItemStandardStore = defineStore('standard', {
  state: () => ({
    items: [],
    pagination: {},
    error: null,
  }),
  actions: {
    async fetchVesselItemStandards(page, limit, search) {
      try {
        const response = await apiVesselItemStandard.getMstVesselItemStandards(page, limit, search)
        this.items = response.items
        this.pagination = response.pagination
        this.error = null
      } catch (error) {
        this.error = error.error
        this.items = []
        this.pagination = {}
      }
    },
    async createVesselItemStandard(standardData) {
      try {
        await apiVesselItemStandard.createVesselItemStandard(standardData)
        this.error = null
      } catch (error) {
        this.error = error.error || 'Failed to create vessel standard'
        throw error
      }
    },
    async updateVesselItemStandard(id, standardData) {
      try {
        await apiVesselItemStandard.updateVesselItemStandard(id, standardData)
        this.error = null
      } catch (error) {
        this.error = error.error || 'Failed to update vessel standard'
        throw error
      }
    },
    async deleteVesselItemStandard(id) {
      try {
        await apiVesselItemStandard.deleteVesselItemStandard(id)
        this.error = null
      } catch (error) {
        this.error = error.error || 'Failed to delete vessel standard'
        throw error
      }
    },
    clearError() {
      this.error = null
    },
  },
})
