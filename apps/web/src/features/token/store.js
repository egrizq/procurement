import { defineStore } from 'pinia'
import * as tokenAPI from './api'
import { setToken } from '@/services/token'

export const useTokenStore = defineStore('token', {
  state: () => ({
    token: null,
    data: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchToken() {
      this.loading = true
      this.error = null
      try {
        const data = await tokenAPI.getToken()
        this.token = data.api_key
        setToken(data.api_key)
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    },

    async fetchTokenInfo() {
      this.loading = true
      this.error = null
      try {
        this.data = await tokenAPI.tokenInfo()
      } catch (error) {
        this.error = error.error
      } finally {
        this.loading = false
      }
    },
  },
})
