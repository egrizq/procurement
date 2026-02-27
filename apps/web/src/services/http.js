import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
})

http.interceptors.request.use((config) => {
  const tokenKey = import.meta.env.VITE_TOKEN_SECRET
  const token = localStorage.getItem(tokenKey)

  if (token) {
    config.headers[tokenKey] = token
  }

  return config
})

http.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.data) {
      return Promise.reject(error.response.data)
    }
    return Promise.reject(error)
  },
)
