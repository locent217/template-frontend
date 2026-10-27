import axios from 'axios'
import { appConfig } from '@/config/app'
import { api } from './api'

export const authService = {
   async csrf() {
      await axios.get(
          `${appConfig.backendUrl}/sanctum/csrf-cookie`,
          {
             withCredentials: true,
             withXSRFToken: true,
          }
      )
   },

   async login(username: string, password: string) {
      await this.csrf()

      const response = await api.post('/login', {
         username,
         password,
      })

      return response.data
   },

   async getUser() {
      const response = await api.get('/me')
      return response.data
   },

   async logout() {
      await api.post('/logout')
   },
}