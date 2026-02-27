import { http } from '@/services/http'

export async function getMstVessels(page, limit, search) {
  const { data } = await http.post('/master-data/vessels', {
    page,
    limit,
    search,
  })
  return data
}
