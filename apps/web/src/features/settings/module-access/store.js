import { defineStore } from 'pinia'
import * as moduleAccessApi from './api.js'

export const USER_TYPES = ['Admin', 'Manager', 'Staff', 'Crew']

export const MODULES = [
  { slug: 'vessels', label: 'Vessels' },
  { slug: 'master-data', label: 'Master Data' },
  { slug: 'master-data/items', label: 'Items', parent: 'master-data' },
  { slug: 'master-data/vendors', label: 'Vendors', parent: 'master-data' },
  { slug: 'master-data/vessel-stocks', label: 'Vessel Stock', parent: 'master-data' },
  { slug: 'request', label: 'Request' },
  { slug: 'moc', label: 'MOC' },
  { slug: 'purchase-order', label: 'Purchase Order' },
  { slug: 'good-receipt', label: 'Good Receipt' },
  { slug: 'settings', label: 'Settings' },
  { slug: 'settings/users', label: 'Manage Users', parent: 'settings' },
  { slug: 'settings/module-access', label: 'Role Access', parent: 'settings' },
  {
    slug: 'settings/vessel-item-standards',
    label: 'Vessel Item Standard',
    parent: 'settings',
  },
]

export const useModuleAccessStore = defineStore('module-access', {
  state: () => ({
    mappings: [],
    myModules: [],
    userType: null,
    error: null,
  }),
  actions: {
    async fetchMyAccess() {
      try {
        const response = await moduleAccessApi.getMyModuleAccess()
        this.myModules = response.modules || []
        this.userType = response.userType || null
        this.error = null
      } catch (error) {
        this.myModules = []
        this.userType = null
        this.error = error.error || 'Failed to load module access'
      }
    },
    async fetchMappings() {
      try {
        const response = await moduleAccessApi.getModuleMappings()
        this.mappings = response.mappings || []
        this.error = null
      } catch (error) {
        this.mappings = []
        this.error = error.error || 'Failed to load role access'
        throw error
      }
    },
    async setAccess(userType, moduleSlug, enabled) {
      try {
        if (enabled) {
          await moduleAccessApi.addModuleMapping({ userType, moduleSlug })
        } else {
          await moduleAccessApi.removeModuleMapping({ userType, moduleSlug })
        }
        await this.fetchMappings()
        this.error = null
      } catch (error) {
        this.error = error.error || 'Failed to update role access'
        throw error
      }
    },
    hasAccess(userType, moduleSlug) {
      return this.mappings.some(
        (mapping) => mapping.userType === userType && mapping.moduleSlug === moduleSlug,
      )
    },
    canOpen(moduleSlug) {
      const parentSlug = moduleSlug.split('/')[0]
      return (
        this.myModules.length === 0 ||
        this.myModules.includes(moduleSlug) ||
        this.myModules.includes(parentSlug)
      )
    },
    canOpenAny(moduleSlugs) {
      return this.myModules.length === 0 || moduleSlugs.some((moduleSlug) => this.canOpen(moduleSlug))
    },
  },
})
