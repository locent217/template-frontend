import axios from 'axios'
import { appConfig } from '@/config/app'

// Supports VITE_API_URL with or without a trailing /api.
const backendUrl = appConfig.apiUrl.replace(/\/+$/, '').replace(/\/api$/, '')

export const api = axios.create({
   baseURL: `${backendUrl}/api`,
   withCredentials: true,
   withXSRFToken: true,
   headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
   },
})

// Sanctum registers this route at the backend root, outside /api.
export const initializeCsrf = async (): Promise<void> => {
   await axios.get(`${backendUrl}/sanctum/csrf-cookie`, {
      withCredentials: true,
      withXSRFToken: true,
      headers: {
         Accept: 'application/json',
         'X-Requested-With': 'XMLHttpRequest',
      },
   })
}
