import { http } from '@/services/http'

export async function getAuditLogs({ page = 1, limit = 20, module, action, userId, from, to } = {}) {
  const params = { page, limit }
  if (module) params.module = module
  if (action) params.action = action
  if (userId) params.userId = userId
  if (from) params.from = from
  if (to) params.to = to

  const { data } = await http.get('/audit-logs', { params })
  return data
}

export async function getAuditLogById(id) {
  const { data } = await http.get(`/audit-logs/${id}`)
  return data
}
