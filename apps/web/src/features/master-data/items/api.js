import { http } from '@/services/http'

export async function getMstItems(page = 1, limit = 10, search = '') {
  const { data } = await http.post('/master-data/items', {
    page,
    limit,
    search,
  })
  return data
}

export async function addMstItem(itemData) {
  const { data } = await http.post('/master-data/items/add', itemData)
  return data
}

export async function updateMstItem(itemCode, itemData) {
  const { data } = await http.put(`/master-data/items/${itemCode}`, itemData)
  return data
}

export async function deleteMstItem(itemCode) {
  const { data } = await http.delete(`/master-data/items/${itemCode}`)
  return data
}