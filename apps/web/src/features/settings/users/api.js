import { http } from '@/services/http'

export async function getUsers(params = {}) {
  const { data } = await http.post('/settings/users/list', params)
  return data
}

export async function createUser(payload) {
  const { data } = await http.post('/settings/users', payload)
  return data
}

export async function updateUser(id, payload) {
  const { data } = await http.put(`/settings/users/${id}`, payload)
  return data
}

export async function deleteUser(id) {
  const { data } = await http.delete(`/settings/users/${id}`)
  return data
}
