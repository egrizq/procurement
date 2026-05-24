import { http } from '@/services/http'

export async function getPurchaseOrders(page = 1, limit = 10, search = '', status = '') {
  const { data } = await http.post('/purchase-orders/list', { page, limit, search, status })
  return data
}

export async function getPurchaseOrderById(id) {
  const { data } = await http.get(`/purchase-orders/${id}`)
  return data
}

export async function createPurchaseOrder(poData) {
  const { data } = await http.post('/purchase-orders', poData)
  return data
}

export async function approvePurchaseOrder(id) {
  const { data } = await http.post(`/purchase-orders/${id}/approve`)
  return data
}

export async function rejectPurchaseOrder(id, rejectionReason) {
  const { data } = await http.post(`/purchase-orders/${id}/reject`, { rejectionReason })
  return data
}
