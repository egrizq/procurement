import { http } from '@/services/http'

export async function getMstVesselStocks(page = 1, limit = 10, search = '') {
  const { data } = await http.post('/master-data/vessel-stocks', {
    page,
    limit,
    search,
  })
  return data
}

export async function getVesselStockById(id) {
  const { data } = await http.get(`/master-data/vessel-stocks/${id}`)
  return data
}

export async function createVesselStock(stockData) {
  const { data } = await http.post('/master-data/vessel-stocks/create', stockData)
  return data
}

export async function updateVesselStock(id, stockData) {
  const { data } = await http.put(`/master-data/vessel-stocks/${id}`, stockData)
  return data
}

export async function deleteVesselStock(id) {
  const { data } = await http.delete(`/master-data/vessel-stocks/${id}`)
  return data
}
