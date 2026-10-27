import { api } from '@/services/api'
import type { PermissionCatalogItem, UserPermissionDetails } from '@/types/auth'

export async function getUserPermissions(userId: string): Promise<UserPermissionDetails> {
   const response = await api.get<UserPermissionDetails>(`/users/${encodeURIComponent(userId)}/permissions`)
   return response.data
}
export async function setUserPermission(userId: string, permissionId: string, allowed: boolean): Promise<void> {
   await api.put(`/users/${encodeURIComponent(userId)}/permissions/${encodeURIComponent(permissionId)}`, { allowed })
}
export async function resetUserPermission(userId: string, permissionId: string): Promise<void> {
   await api.delete(`/users/${encodeURIComponent(userId)}/permissions/${encodeURIComponent(permissionId)}`)
}
// Required read-only catalog endpoint; see BACKEND-CONTRACT.md.
export async function listPermissionCatalog(): Promise<PermissionCatalogItem[]> {
   const response = await api.get<PermissionCatalogItem[] | { data: PermissionCatalogItem[] }>('/permissions')
   return Array.isArray(response.data) ? response.data : response.data.data
}
