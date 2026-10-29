import axios from 'axios'
import { appConfig } from '@/config/app'
import router from '@/router'

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

// Attach the server-generated correlation ID to failed API requests for support/debugging.
api.interceptors.response.use(
   response => response,
   error => {
      const requestId = error?.response?.headers?.['x-request-id']
      if (requestId && typeof requestId === 'string') {
         error.auditRequestId = requestId
         console.error('API request failed. Reference ID:', requestId)
      }
      if (error?.response?.status === 503 && error?.response?.data?.code === 'SYSTEM_MAINTENANCE' && router.currentRoute.value.path !== '/maintenance') {
         void router.replace('/maintenance')
      }
      return Promise.reject(error)
   },
)
