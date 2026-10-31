import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { maintenanceService } from '@/services/maintenanceService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: () => import('@/layouts/AuthLayout.vue'), meta: { guest: true }, children: [{ path: '', component: () => import('@/pages/Login.vue') }] },
    { path: '/', component: () => import('@/layouts/MainLayout.vue'), meta: { auth: true }, children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('@/pages/Dashboard.vue'), meta: { permission: 'dashboard.view' } },
      { path: 'departments', component: () => import('@/pages/Departments.vue'), meta: { permission: 'departments.view' } },
      { path: 'user-types', component: () => import('@/pages/UserTypes.vue'), meta: { permission: 'user_types.view' } },
      { path: 'branches', component: () => import('@/pages/Branches.vue'), meta: { permission: 'branches.view' } },
      { path: 'islands', component: () => import('@/pages/Islands.vue'), meta: { permission: 'islands.view' } },
      { path: 'territories', component: () => import('@/pages/Territories.vue'), meta: { permission: 'territories.view' } },
      { path: 'regions', component: () => import('@/pages/Regions.vue'), meta: { permission: 'regions.view' } },
      { path: 'modules', component: () => import('@/pages/Modules.vue'), meta: { permission: 'modules.view', superAdmin: true } },
      { path: 'permissions', component: () => import('@/pages/Permissions.vue'), meta: { permission: 'permissions.view', superAdmin: true } },
      { path: 'department-user-type-permissions', component: () => import('@/pages/DefaultPermissions.vue'), meta: { permission: 'department_user_type_permissions.view', superAdmin: true } },
      { path: 'audit-logs', component: () => import('@/pages/AuditLogs.vue'), meta: { auditLogsOnly: true } },
      { path: 'users', component: () => import('@/pages/Users.vue'), meta: { permission: 'users.view' } },
    ] },
    { path: '/account-recovery', component: () => import('@/pages/AccountRecovery.vue'), meta: { guest: true } },
    { path: '/change-password', component: () => import('@/pages/ChangePassword.vue'), meta: { auth: true } },
    { path: '/first-use', component: () => import('@/pages/FirstUseCredentials.vue'), meta: { auth: true } },
    { path: '/maintenance', component: () => import('@/pages/Maintenance.vue') },
    { path: '/forbidden', component: () => import('@/pages/Forbidden.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFound.vue') },
  ],
})
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  // Check before restoring the session so a 503 cannot cause a login redirect loop.
  // If the status endpoint itself is unavailable, let the normal API error handling apply.
  if (to.path !== '/maintenance') {
    try {
      const status = await maintenanceService.status()
      if (status.enabled && !auth.isSuperAdmin) {
        // Restore auth only to determine whether this user has a Super Admin bypass.
        try { await auth.restore() } catch { return '/maintenance' }
        if (!auth.isSuperAdmin) {
            return '/maintenance'
        }
      }
    } catch { /* The application may be temporarily unreachable. */ }
  }
  if (to.path === '/maintenance') {
      return
  }
  try {
    await auth.restore()
  } catch (error) {
    console.error("Unable to verify session", error)
    if (to.path !== "/login") {
        return { path: "/login", query: { unavailable: "1" } }
    }
    return
  }
  if (to.matched.some(r => r.meta.auth) && !auth.isAuthenticated) {
      return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (auth.isAuthenticated && auth.user?.first_use && to.path !== '/first-use') {
      return '/first-use'
  }
  if (to.path === '/first-use' && auth.isAuthenticated && !auth.user?.first_use) {
      return '/dashboard'
  }
  if (to.matched.some(r => r.meta.guest) && auth.isAuthenticated) {
      return '/dashboard'
  }
  const permission = to.meta.permission as import('@/types/auth').Permission | undefined
  if (to.path === '/users' && !auth.has('users.view')) {
      return '/forbidden'
  }
  if (to.meta.auditLogsOnly && !auth.canViewAuditLogs) {
      return '/forbidden'
  }
  if (to.meta.superAdmin && !auth.isSuperAdmin) {
      return '/forbidden'
  }
  if (permission && !auth.has(permission)) {
      return '/forbidden'
  }
})
export default router
