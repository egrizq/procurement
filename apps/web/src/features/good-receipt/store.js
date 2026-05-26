import { defineStore } from 'pinia'
import * as grAPI from './api.js'

export const useGoodReceiptStore = defineStore('goodReceipt', {
  state: () => ({
    grs: [],
    currentGR: null,
    pendingPOs: [],
    pagination: {},
    error: null,
  }),
  actions: {
    async fetchGoodReceipts(page, limit, search, status) {
      try {
        const data = await grAPI.getGoodReceipts(page, limit, search, status)
        this.grs = data.goodReceipts
        this.pagination = data.pagination
        this.error = null
      } catch (error) {
        this.error = error.error || 'Failed to fetch good receipts.'
      }
    },

    async fetchPendingPOs() {
      try {
        const data = await grAPI.getPendingPOsForReceipt()
        this.pendingPOs = data.purchaseOrders
        this.error = null
      } catch (error) {
        this.error = error.error || 'Failed to fetch pending purchase orders.'
      }
    },

    async createGoodReceipt(grData) {
      try {
        const data = await grAPI.createGoodReceipt(grData)
        this.grs.unshift(data.goodReceipt)
        this.error = null
        return data.goodReceipt
      } catch (error) {
        this.error = error.error || 'Failed to create good receipt.'
        throw error
      }
    },

    async fetchGoodReceiptById(id) {
      try {
        const data = await grAPI.getGoodReceiptById(id)
        this.currentGR = data.goodReceipt
        this.error = null
      } catch (error) {
        this.error = error.error || 'Failed to fetch good receipt detail.'
        throw error
      }
    },

    clearError() {
      this.error = null
    },
  },
})
