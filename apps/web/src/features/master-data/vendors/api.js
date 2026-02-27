import { http } from '@/services/http'

export async function getMstVendors(page, limit, search) {
  const { data } = await http.post('/master-data/vendors', {
    page,
    limit,
    search,
  })
  return data
}
