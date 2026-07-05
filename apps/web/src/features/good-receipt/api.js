import { http } from '@/services/http'

export async function getGoodReceipts(page = 1, limit = 10, search = '', status = '') {
  const { data } = await http.post('/good-receipts/list', { page, limit, search, status })
  return data
}

export async function getPendingPOsForReceipt() {
  const { data } = await http.get('/good-receipts/po-list')
  return data
}

export async function createGoodReceipt(grData) {
  const { data } = await http.post('/good-receipts', grData)
  return data
}

export async function getGoodReceiptById(id) {
  const { data } = await http.get(`/good-receipts/${id}`)
  return data
}

export async function uploadFiles(files) {
  const formData = new FormData()
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i])
  }
  const { data } = await http.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data
}
