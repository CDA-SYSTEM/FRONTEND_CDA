import axios from 'axios'
import { useAuthStore } from '@/core/store/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  timeout: 15000,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  const apiKey = import.meta.env.VITE_API_KEY_FRONT

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (apiKey) {
    config.headers['X-API-Key'] = apiKey
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }

    return Promise.reject(error)
  },
)
