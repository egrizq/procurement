import { http } from '@/services/http'

export async function getRequests(page, limit, search) {
  const { data } = await http.post('/vessel-requests/list', {
    page,
    limit,
    search,
  })
  return data
}

export async function getRequestsById(id) {
  const { data } = await http.post(`/vessel-requests/list/${id}`)
  return data
}

export async function createRequest(requestData) {
  await http.post('/vessel-requests', requestData)
}

export async function updateRequest(id, requestData) {
  await http.put(`/vessel-requests/${id}`, requestData)
}

export async function deleteRequest(id) {
  await http.delete(`/vessel-requests/${id}`)
}
