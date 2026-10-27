import { api, initializeCsrf } from '@/services/api'
import type { AuthUser } from '@/types/auth'
export interface LoginCredentials { username: string; password: string }
export const authService = {
   async login(credentials: LoginCredentials): Promise<void> {
      await initializeCsrf()
      await api.post('/login', credentials)
   },
   async getUser(): Promise<AuthUser> {
      const response = await api.get<AuthUser>('/me')
      return response.data
   },
   async logout(): Promise<void> {
      await api.post('/logout')
   },
}
