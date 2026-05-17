import { defineStore } from 'pinia'
import * as userApi from './api.js'

export const useSettingsUserStore = defineStore('settings-users', {
  state: () => ({
    users: [],
    pagination: {},
    error: null,
  }),
  actions: {
    async fetchUsers(params) {
      try {
        const response = await userApi.getUsers(params)
        this.users = response.items || []
        this.pagination = response.pagination || {}
        this.error = null
      } catch (error) {
        this.users = []
        this.pagination = {}
        this.error = error.error || 'Failed to load users'
        throw error
      }
    },
    async createUser(payload) {
      try {
        await userApi.createUser(payload)
        this.error = null
      } catch (error) {
        this.error = error.error || 'Failed to create user'
        throw error
      }
    },
    async updateUser(id, payload) {
      try {
        await userApi.updateUser(id, payload)
        this.error = null
      } catch (error) {
        this.error = error.error || 'Failed to update user'
        throw error
      }
    },
    async deleteUser(id) {
      try {
        await userApi.deleteUser(id)
        this.error = null
      } catch (error) {
        this.error = error.error || 'Failed to deactivate user'
        throw error
      }
    },
  },
})
