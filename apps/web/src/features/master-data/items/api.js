import { http } from '@/services/http'

export async function getMstItems(page = 1, limit = 10, search = '') {
  const { data } = await http.post('/master-data/items', {
    page,
    limit,
    search,
  })
  return data
}
