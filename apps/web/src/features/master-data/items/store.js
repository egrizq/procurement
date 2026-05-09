import { defineStore } from 'pinia'
import * as apiMasterItem from './api.js'

export const useItemStore = defineStore('item', {
  state: () => ({
    items: [],
    pagination: {},
    error: null,
  }),
  actions: {
    async fetchItems(page, limit, search) {
      try {
        const response = await apiMasterItem.getMstItems(page, limit, search)
        this.items = response.items
        this.pagination = response.pagination
      } catch (error) {
        this.error = error.error
        throw error
      }
    },
    async addItem(itemData) {
      try {
        await apiMasterItem.addMstItem(itemData)
      } catch (error) {
        this.error = error.error
        throw error
      }
    },
    async updateItem(id, itemData) {
      try {
        await apiMasterItem.updateMstItem(id, itemData)
      } catch (error) {
        this.error = error.error
        throw error
      }
    },
    async deleteItem(id) {
      try {
        await apiMasterItem.deleteMstItem(id)
      } catch (error) {
        this.error = error.error
        throw error
      }
    },
    clearError() {
      this.error = null
    },
  },
})
