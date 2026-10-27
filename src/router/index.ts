import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: () => import('@/layouts/AuthLayout.vue'), meta: { guest: true }, children: [{ path: '', component: () => import('@/pages/Login.vue') }] },
    { path: '/', component: () => import('@/layouts/MainLayout.vue'), meta: { auth: true }, children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('@/pages/Dashboard.vue'), meta: { permission: 'dashboard.view' } },
      { path: 'users', component: () => import('@/pages/Users.vue'), meta: { permission: 'users.view' } },
    ] },
    { path: '/forbidden', component: () => import('@/pages/Forbidden.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  try {
    await auth.restore()
  } catch (error) {
    console.error("Unable to verify session", error)
    if (to.path !== "/login") return { path: "/login", query: { unavailable: "1" } }
    return
  }
  if (to.matched.some(r => r.meta.auth) && !auth.isAuthenticated) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.matched.some(r => r.meta.guest) && auth.isAuthenticated) return '/dashboard'
  const permission = to.meta.permission as import('@/types/auth').Permission | undefined
  if (to.path === '/users' && !auth.has('users.view')) return '/forbidden'
  if (permission && !auth.has(permission)) return '/forbidden'
})
export default router
