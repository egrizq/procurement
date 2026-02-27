import { http } from '@/services/http'

export async function getMstCategoryItems(page, limit, search) {
  const { data } = await http.post('/master-data/category-items', {
    page,
    limit,
    search,
  })
  return data
}
