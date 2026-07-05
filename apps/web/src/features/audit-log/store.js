import { defineStore } from 'pinia'
import { getAuditLogs, getAuditLogById } from './api.js'

export const useAuditLogStore = defineStore('auditLog', {
  state: () => ({
    logs: [],
    pagination: null,
    selectedLog: null,
    loading: false,
    error: null,
    filters: {
      module: '',
      action: '',
      from: '',
      to: '',
    },
  }),

  actions: {
    async fetchLogs(page = 1) {
      this.loading = true
      this.error = null
      try {
        const params = { page, limit: 20 }
        if (this.filters.module) params.module = this.filters.module
        if (this.filters.action) params.action = this.filters.action
        if (this.filters.from) params.from = this.filters.from
        if (this.filters.to) params.to = this.filters.to

        const res = await getAuditLogs(params)
        this.logs = res.data?.auditLogs ?? []
        this.pagination = res.data?.pagination ?? null
      } catch (err) {
        this.error = err?.response?.data?.message ?? 'Gagal memuat audit log'
      } finally {
        this.loading = false
      }
    },

    async fetchLogById(id) {
      this.loading = true
      this.error = null
      try {
        const res = await getAuditLogById(id)
        this.selectedLog = res.data?.auditLog ?? null
      } catch (err) {
        this.error = err?.response?.data?.message ?? 'Gagal memuat detail log'
      } finally {
        this.loading = false
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
    },

    resetFilters() {
      this.filters = { module: '', action: '', from: '', to: '' }
    },

    clearSelectedLog() {
      this.selectedLog = null
    },
  },
})
