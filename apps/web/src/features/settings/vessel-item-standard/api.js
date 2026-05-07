import { http } from '@/services/http'

export async function getMstVesselItemStandards(page = 1, limit = 10, search = '') {
  const { data } = await http.post('/settings/vessel-item-standards/list', {
    page,
    limit,
    search,
  })
  return data
}

export async function getVesselItemStandardById(id) {
  const { data } = await http.get(`/settings/vessel-item-standards/${id}`)
  return data
}

export async function createVesselItemStandard(standardData) {
  const { data } = await http.post('/settings/vessel-item-standards', standardData)
  return data
}

export async function updateVesselItemStandard(id, standardData) {
  const { data } = await http.put(`/settings/vessel-item-standards/${id}`, standardData)
  return data
}

export async function deleteVesselItemStandard(id) {
  const { data } = await http.delete(`/settings/vessel-item-standards/${id}`)
  return data
}
