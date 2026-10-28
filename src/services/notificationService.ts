import { api } from '@/services/api'
export interface AppNotification {
   id: string
   data: { title?: string; message?: string; type?: string; url?: string }
   created_at: string
   read_at: string | null
}
export interface NotificationPage {
   items: { data: AppNotification[]; current_page: number; last_page: number; total: number }
   unread_count: number
}
export const notificationService = {
   async list(page = 1): Promise<NotificationPage> {
      const { data } = await api.get<NotificationPage>('/notifications', { params: { page } })
      return data
   },
   async mark(id: string, read: boolean): Promise<void> {
      await api.patch(`/notifications/${encodeURIComponent(id)}/${read ? 'read' : 'unread'}`)
   },
}
