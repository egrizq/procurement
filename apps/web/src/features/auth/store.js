import { defineStore } from 'pinia'
import * as authAPI from './api'

export const useAuthStore = defineStore('login', {
  state: () => ({
    loading: false,
    error: null,
    errors: null,
  }),

  actions: {
    async login(email, password) {
      this.loading = true
      this.error = null
      try {
        await authAPI.login(email, password)
      } catch (error) {
        this.error = error.error
        this.errors = error.errors?.[0]?.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      this.error = null
      try {
        await authAPI.logout()
      } catch (error) {
        this.error = error.error
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
