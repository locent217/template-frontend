import { api, initializeCsrf } from '@/services/api'
import type { AuthUser } from '@/types/auth'
export interface LoginCredentials { username: string; password: string; remember: boolean }
export const authService = {
   async login(credentials: LoginCredentials): Promise<void> {
      await initializeCsrf()
      await api.post('/login', credentials)
   },
   async getUser(): Promise<AuthUser> {
      const response = await api.get<AuthUser>('/me')
      return response.data
   },
   async changeFirstUseCredentials(payload: { current_password: string; username: string; password: string; password_confirmation: string }): Promise<void> {
      await api.post('/account/credentials', payload)
   },
   async forgotUsername(email: string): Promise<string> {
      await initializeCsrf()
      const response = await api.post<{ message: string }>('/account/forgot-username', { email })
      return response.data.message
   },
   async forgotPassword(email: string): Promise<string> {
      await initializeCsrf()
      const response = await api.post<{ message: string }>('/account/forgot-password', { email })
      return response.data.message
   },
   async resetPassword(payload: { email: string; otp: string; password: string; password_confirmation: string }): Promise<void> {
      await initializeCsrf()
      await api.post('/account/reset-password', payload)
   },
   async changePassword(payload: { current_password: string; password: string; password_confirmation: string }): Promise<void> {
      await api.post('/account/change-password', payload)
   },
   async logout(): Promise<void> {
      await api.post('/logout')
   },
}
