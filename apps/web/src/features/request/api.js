import { http } from '@/services/http'

export async function getRequests(page, limit, search, status) {
  const { data } = await http.post('/vessel-requests/list', {
    page,
    limit,
    search,
    status
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

export async function validateRequestForm(requestData) {
  const { data } = await http.post('/vessel-requests/validate', requestData)
  return data
}

export async function reviewRequest(id, payload) {
  const { data } = await http.post(`/vessel-requests/${id}/review`, payload)
  return data
}
