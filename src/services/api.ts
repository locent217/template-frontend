import axios from 'axios'
import { appConfig } from '@/config/app'

export const api = axios.create({
   baseURL: appConfig.apiUrl,
   withCredentials: true,
   withXSRFToken: true,
   headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
   },
})
