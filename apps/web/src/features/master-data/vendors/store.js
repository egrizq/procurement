import { defineStore } from 'pinia'
import * as apiMasterVendor from './api.js'

export const useVendorStore = defineStore('vendor', {
  state: () => ({
    vendors: [],
    cities: [],
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

    async addVendor(vendorData) {
      try {
        vendorData.category = parseInt(vendorData.category)
        await apiMasterVendor.addMstVendor(vendorData)
      } catch (error) {
        this.error = error.error
      }
    },

    async updateVendor(vendorId, vendorData) {
      try {
        vendorData.category = parseInt(vendorData.category)
        await apiMasterVendor.updateMstVendor(vendorId, vendorData)
        const index = this.vendors.findIndex((vendor) => vendor.id === vendorId)
        if (index !== -1) {
          this.vendors[index] = { ...this.vendors[index], ...vendorData }
        }
      } catch (error) {
        this.error = error.error
      }
    },

    async deleteVendor(vendorId) {
      try {
        await apiMasterVendor.deleteMstVendor(vendorId)
        this.vendors = this.vendors.filter((vendor) => vendor.id !== vendorId)
      } catch (error) {
        this.error = error.error
      }
    },

    async fetchCities() {
      try {
        const cities = await apiMasterVendor.getMstCity()
        this.cities = cities
        console.log('Fetched cities:', cities) // Debug log
      } catch (error) {
        this.error = error.error
        return []
      }
    },

    clearError() {
      this.error = null
    },
  },
})
