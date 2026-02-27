import { http } from '@/services/http'

export async function getMstVessels(page = 1, limit = 10, search = '') {
  const { data } = await http.post('/master-data/vessels', {
    page,
    limit,
    search,
  })
  return data
}

export async function getVesselById(id) {
  const { data } = await http.get(`/master-data/vessels/${id}`)
  return data
}

export async function createVessel(vesselData) {
  const { data } = await http.post('/master-data/vessels/create', vesselData)
  return data
}

export async function updateVessel(id, vesselData) {
  const { data } = await http.put(`/master-data/vessels/${id}`, vesselData)
  return data
}

export async function deleteVessel(id) {
  const { data } = await http.delete(`/master-data/vessels/${id}`)
  return data
}
