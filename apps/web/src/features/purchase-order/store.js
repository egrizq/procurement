import { defineStore } from 'pinia'
import * as poAPI from './api.js'

export const usePurchaseOrderStore = defineStore('purchaseOrder', {
  state: () => ({
    pos: [],
    currentPO: null,
    pagination: {},
    error: null,
  }),
  actions: {
    async fetchPOs(page, limit, search, status) {
      try {
        const data = await poAPI.getPurchaseOrders(page, limit, search, status)
        this.pos = data.purchaseOrders
        this.pagination = data.pagination
        this.error = null
      } catch (error) {
        this.error = error.error || 'Failed to fetch purchase orders.'
      }
    },

    async fetchPOById(id) {
      try {
        const data = await poAPI.getPurchaseOrderById(id)
        this.currentPO = data.purchaseOrder
        this.error = null
      } catch (error) {
        this.error = error.error || 'Failed to fetch purchase order.'
        throw error
      }
    },

    async createPO(poData) {
      try {
        const data = await poAPI.createPurchaseOrder(poData)
        this.pos.unshift(data.purchaseOrder)
        this.error = null
        return data.purchaseOrder
      } catch (error) {
        this.error = error.error || 'Failed to create purchase order.'
        throw error
      }
    },

    async approvePO(id) {
      try {
        const data = await poAPI.approvePurchaseOrder(id)
        this._updateInList(data.purchaseOrder)
        this.error = null
        return data.purchaseOrder
      } catch (error) {
        this.error = error.error || 'Failed to approve purchase order.'
        throw error
      }
    },

    async rejectPO(id, rejectionReason) {
      try {
        const data = await poAPI.rejectPurchaseOrder(id, rejectionReason)
        this._updateInList(data.purchaseOrder)
        this.error = null
        return data.purchaseOrder
      } catch (error) {
        this.error = error.error || 'Failed to reject purchase order.'
        throw error
      }
    },

    _updateInList(po) {
      const idx = this.pos.findIndex((p) => p.id === po.id)
      if (idx !== -1) this.pos[idx] = po
      if (this.currentPO?.id === po.id) this.currentPO = po
    },

    clearError() {
      this.error = null
    },
  },
})
