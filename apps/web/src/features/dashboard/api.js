import { http } from '@/services/http'

export async function getDashboardStats() {
  const { data } = await http.get('/dashboard')
  return data
}
