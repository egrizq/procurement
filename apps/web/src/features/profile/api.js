import { http } from '@/services/http'

export async function getProfile() {
  const { data } = await http.get('/profile')
  return data
}
