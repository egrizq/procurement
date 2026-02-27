import { http } from '@/services/http'
import { getDeviceId } from '@/utils/deviceId'

export async function getToken() {
  const { data } = await http.post('/token', {
    device_name: 'web_client',
    device_id: getDeviceId(),
  })
  return data
}

export async function tokenInfo() {
  const { data } = await http.get('/token/info')
  console.log('Token Info:', data)
  return data
}
