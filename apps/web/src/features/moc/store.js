import { defineStore } from 'pinia'
import * as requestAPI from '../request/api'
import * as mocAPI from './api'

export const useMocStore = defineStore('moc', {
  state: () => ({
    mocs: [],
    currentMoc: null,
    requests: [],
    pagination: {},
    error: null,
  }),
  actions: {
    async fetchApprovedRequests(page, limit, search) {
      try {
        const data = await requestAPI.getRequests(page, limit, search, 'Approved')
        this.requests = data.requests
        this.pagination = data.pagination
      } catch (error) {
        this.error = error.error || 'Failed to fetch approved requests.'
      }
    },

    async fetchMocs(page, limit, search, status) {
      try {
        const data = await mocAPI.getMocs(page, limit, search, status)
        this.mocs = data.mocs
        this.pagination = data.pagination
      } catch (error) {
        this.error = error.error || 'Failed to fetch MOC drafts.'
      }
    },

    async fetchMocById(id) {
      try {
        const data = await mocAPI.getMocById(id)
        this.currentMoc = data.moc
      } catch (error) {
        this.error = error.error || 'Failed to fetch MOC details.'
      }
    },

    async createMoc(mocData) {
      try {
        const data = await mocAPI.createMoc(mocData)
        this.mocs.unshift(data.moc)
        return data.moc
      } catch (error) {
        if (error.errors && Array.isArray(error.errors)) {
          this.error = error.errors.map(err => err.message).join(', ')
        } else {
          this.error = error.error || 'Failed to create MOC.'
        }
        throw error
      }
    },

    async updateMoc(id, mocData) {
      try {
        const data = await mocAPI.updateMoc(id, mocData)
        const index = this.mocs.findIndex((m) => m.id === id)
        if (index !== -1) {
          this.mocs[index] = data.moc
        }
        if (this.currentMoc && this.currentMoc.id === id) {
          this.currentMoc = data.moc
        }
        return data.moc
      } catch (error) {
         if (error.errors && Array.isArray(error.errors)) {
          this.error = error.errors.map(err => err.message).join(', ')
        } else {
          this.error = error.error || 'Failed to update MOC.'
        }
        throw error
      }
    },

    async deleteMoc(id) {
      try {
        await mocAPI.deleteMoc(id)
        this.mocs = this.mocs.filter((m) => m.id !== id)
      } catch (error) {
        this.error = error.error || 'Failed to delete MOC.'
        throw error
      }
    },

    clearError() {
      this.error = null
    },
  },
})