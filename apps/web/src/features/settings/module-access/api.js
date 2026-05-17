import { http } from '@/services/http'

export async function getMyModuleAccess() {
  const { data } = await http.get('/settings/module-access/me')
  return data
}

export async function getModuleMappings() {
  const { data } = await http.get('/settings/module-access')
  return data
}

export async function addModuleMapping(payload) {
  const { data } = await http.post('/settings/module-access', payload)
  return data
}

export async function removeModuleMapping(payload) {
  const { data } = await http.delete('/settings/module-access', { data: payload })
  return data
}
