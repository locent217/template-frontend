import axios from 'axios'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authService, type LoginCredentials } from '@/services/authService'
import type { AuthUser, Permission } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
   const user = ref<AuthUser | null>(null)
   const initialized = ref(false)
   const loading = ref(false)
   const isAuthenticated = computed(() => user.value !== null)

   function has(permission: Permission): boolean {
      return user.value?.permissions.includes(permission) ?? false
   }

   // Codes must match the immutable codes returned by Laravel /api/me.
   const isSuperAdmin = computed(() => user.value?.user_type?.code === 'SUPER_ADMIN')

   const isUserManagerGroup = computed(() => {
      const role = user.value?.user_type?.code?.toUpperCase()
      const department = user.value?.department?.code?.toUpperCase()

      return role === 'SUPER_ADMIN'
         || role === 'ADMIN'
         || department === 'IT'
   })

   function canManageUsers(permission: string): boolean {
      return isUserManagerGroup.value && has(permission)
   }

   async function fetchUser(): Promise<AuthUser> {
      const authenticatedUser = await authService.getUser()
      user.value = authenticatedUser
      initialized.value = true
      return authenticatedUser
   }

   async function restore(): Promise<void> {
      if (initialized.value) return

      try {
         await fetchUser()
      } catch (error) {
         if (axios.isAxiosError(error) && [401, 419].includes(error.response?.status ?? 0)) {
            user.value = null
            initialized.value = true
            return
         }

         // Keep the state unresolved so temporary outages aren't mistaken for logout.
         throw error
      }
   }

   async function login(credentials: LoginCredentials): Promise<void> {
      loading.value = true

      try {
         await authService.login(credentials.username, credentials.password)
         await fetchUser()
      } finally {
         loading.value = false
      }
   }

   async function logout(): Promise<void> {
      loading.value = true

      try {
         await authService.logout()
         user.value = null
         initialized.value = true
      } finally {
         loading.value = false
      }
   }

   return {
      user,
      initialized,
      loading,
      isAuthenticated,
      has,
      isUserManagerGroup,
      isSuperAdmin,
      canManageUsers,
      fetchUser,
      restore,
      login,
      logout,
   }
})
