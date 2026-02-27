import { http } from '@/services/http'

export async function login(email, password) {
  const { data } = await http.post('/auth/login', {
    email,
    password,
  })
  return data
}

export async function logout() {
  await http.post('/auth/logout')
}
