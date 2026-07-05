import { http } from '@/services/http'

export async function getMocs(page, limit, search, status) {
  const { data } = await http.post('/moc/list', {
    page,
    limit,
    search,
    status,
  })
  return data
}

export async function getMocById(id) {
  const { data } = await http.get(`/moc/${id}`)
  return data
}

export async function createMoc(mocData) {
  const { data } = await http.post('/moc', mocData)
  return data
}

export async function updateMoc(id, mocData) {
  const { data } = await http.put(`/moc/${id}`, mocData)
  return data
}

export async function deleteMoc(id) {
  const { data } = await http.delete(`/moc/${id}`)
  return data
}

export async function scoreMoc(id) {
  const { data } = await http.post(`/moc/${id}/score`)
  return data
}

export async function submitSawWeightRequest(mocId, payload) {
  const { data } = await http.post(`/moc/${mocId}/saw-weight-request`, payload)
  return data
}

export async function reviewSawWeightRequest(requestId, action, rejectReason) {
  const { data } = await http.put(`/moc/saw-weight-request/${requestId}/review`, {
    action,
    rejectReason,
  })
  return data
}
