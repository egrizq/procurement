import { defineStore } from 'pinia'
import * as profileApi from './api'

const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: null,
    error: null,
  }),
  actions: {
    async fetchProfile() {
      try {
        this.profile = await profileApi.getProfile()
      } catch (error) {
        this.error = error.error
      }
    },
  },
})

export default useProfileStore
