import { http } from '@/services/http'

export async function getMstCategoryItems(page, limit, search) {
  const { data } = await http.post('/master-data/category-items', {
    page,
    limit,
    search,
  })
  return data
}

export async function addMstCategoryItem(categoryData) {
  const { data } = await http.post('/master-data/category-items/add', categoryData)
  return data
}

export async function updateMstCategoryItem(id, categoryData) {
  const { data } = await http.put(`/master-data/category-items/${id}`, categoryData)
  return data
}

export async function deleteMstCategoryItem(id) {
  const { data } = await http.delete(`/master-data/category-items/${id}`)
  return data
}
