import { http } from '@/services/http'

export async function getMstVendors(page, limit, search) {
  const { data } = await http.post('/master-data/vendors', {
    page,
    limit,
    search,
  })
  return data
}

export async function addMstVendor(vendorData) {
  await http.post('/master-data/vendors/add', vendorData)
}

export async function updateMstVendor(vendorId, vendorData) {
  await http.put(`/master-data/vendors/${vendorId}`, vendorData)
}

export async function deleteMstVendor(vendorId) {
  await http.delete(`/master-data/vendors/${vendorId}`)
}

export async function getMstCity() {
  const { data } = await http.get('/master-data/cities')
  return data
}