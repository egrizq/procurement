import { defineStore } from 'pinia'
import * as requestAPI from './api'

export const useRequestStore = defineStore('request', {
  state: () => ({
    requests: [],
    pagination: {},
    error: null,
  }),
  actions: {
    async fetchRequests(page, limit, search) {
      try {
        const data = await requestAPI.getRequests(page, limit, search)
        this.requests = data.requests
        this.pagination = data.pagination
      } catch (error) {
        this.error = error.error || 'Failed to fetch requests.'
      }
    },
    async fetchRequestById(id) {
      try {
        const request = await requestAPI.getRequestsById(id)
        return request
      } catch (error) {
        this.error = error.error || 'Failed to fetch request details.'
        return null
      } finally {
        this.error = null
      }
    },
    async validateRequest(requestData) {
      try {
        return await requestAPI.validateRequestForm(requestData)
      } catch (error) {
        this.error = error.error || 'Failed to validate request.'
        throw error
      } finally {
        this.error = null
      }
    },
    async createRequest(requestData) {
      try {
        await requestAPI.createRequest(requestData)
        await this.fetchRequests()
      } catch (error) {
        this.error = error.error || 'Failed to create request.'
        throw error
      } finally {
        this.error = null
      }
    },
    async updateRequest(id, requestData) {
      try {
        await requestAPI.updateRequest(id, requestData)
        await this.fetchRequests()
      } catch (error) {
        this.error = error.error || 'Failed to update request.'
        throw error
      } finally {
        this.error = null
      }
    },
    async reviewRequest(id, payload) {
      try {
        await requestAPI.reviewRequest(id, payload)
        await this.fetchRequests()
      } catch (error) {
        this.error = error.error || 'Failed to review request.'
        throw error
      } finally {
        this.error = null
      }
    },
    async deleteRequest(id) {
      try {
        await requestAPI.deleteRequest(id)
        await this.fetchRequests()
      } catch (error) {
        this.error = error.error || 'Failed to delete request.'
        throw error
      } finally {
        this.error = null
      }
    },
    async downloadPdf(id, itemId) {
      try {
        return await requestAPI.downloadRequestPdf(id, itemId)
      } catch (error) {
        this.error = error.error || 'Failed to download PDF.'
        throw error
      } finally {
        this.error = null
      }
    },
    clearError() {
      this.error = null
    },
  },
})
