import { defineStore } from 'pinia'
import * as apiCategoryItem from './api.js'

export const useCategoryItemStore = defineStore('category-item', {
  state: () => ({
    categories: [],
    pagination: {},
    error: null,
  }),
  actions: {
    async fetchCategories(page, limit, search) {
      try {
        const response = await apiCategoryItem.getMstCategoryItems(page, limit, search)
        this.categories = response.items
        this.pagination = response.pagination
      } catch (error) {
        this.error = error.error || error.message
        throw error
      }
    },
    async addCategory(categoryData) {
      try {
        await apiCategoryItem.addMstCategoryItem(categoryData)
      } catch (error) {
        this.error = error.error || error.message
        throw error
      }
    },
    async updateCategory(id, categoryData) {
      try {
        await apiCategoryItem.updateMstCategoryItem(id, categoryData)
      } catch (error) {
        this.error = error.error || error.message
        throw error
      }
    },
    async deleteCategory(id) {
      try {
        await apiCategoryItem.deleteMstCategoryItem(id)
      } catch (error) {
        this.error = error.error || error.message
        throw error
      }
    },
    clearError() {
      this.error = null
    },
  },
})
