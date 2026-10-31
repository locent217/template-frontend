import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationService, type AppNotification } from '@/services/notificationService'
export const useNotificationStore = defineStore('notifications', () => {
   const items = ref<AppNotification[]>([])
   const unreadCount = ref(0)
   const page = ref(1)
   const lastPage = ref(1)
   const loading = ref(false)
   async function refresh(nextPage = page.value) {
      if (loading.value) {
          return
      }
      loading.value = true
      try {
         const result = await notificationService.list(nextPage)
         items.value = result.items.data
         page.value = result.items.current_page
         lastPage.value = result.items.last_page
         unreadCount.value = result.unread_count
      } finally { loading.value = false }
   }
   async function mark(id: string, read: boolean) {
      await notificationService.mark(id, read)
      await refresh()
   }
   function clear() { items.value = []; unreadCount.value = 0; page.value = 1; lastPage.value = 1 }
   return { items, unreadCount, page, lastPage, loading, refresh, mark, clear }
})
