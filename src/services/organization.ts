import { api } from '@/services/api'

export type OrganizationResource = 'departments' | 'user-types' | 'branches' | 'regions' | 'territories' | 'islands' | 'modules' | 'permissions' | 'department-user-type-permissions'
export type RecordData = { id: string; [key: string]: unknown }
export type OrganizationRecord = RecordData
export type OrganizationPayload = Record<string, unknown>
export function unwrapList<T>(data: any): T[] {
   const value = data?.data ?? data
   return Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : []
}
export async function listOrganization(resource: OrganizationResource): Promise<OrganizationRecord[]> {
   const { data } = await api.get(`/${resource}`)
   return unwrapList<OrganizationRecord>(data)
}
export async function createOrganization(resource: OrganizationResource, payload: OrganizationPayload): Promise<void> {
   await api.post(`/${resource}/add`, payload)
}
export async function updateOrganization(resource: OrganizationResource, id: string, payload: OrganizationPayload): Promise<void> {
   await api.put(`/${resource}/update/${encodeURIComponent(id)}`, payload)
}
export async function deleteOrganization(resource: OrganizationResource, id: string): Promise<void> {
   await api.delete(`/${resource}/delete/${encodeURIComponent(id)}`)
}
