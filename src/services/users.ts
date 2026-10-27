import { api } from '@/services/api'
import type { LookupOption, UserRecord } from '@/types/auth'

export interface UserPayload {
   username: string; email: string; first_name: string; middle_name: string | null; last_name: string;
   password?: string; user_type_id: string | null; department_id: string | null;
   branch_id: string | null; region_id: string | null; territory_id: string | null; island_id: string | null;
   active: boolean;
}
function unpack<T>(response: { data: T | { data: T } }): T {
   const data = response.data
   return data && typeof data === 'object' && 'data' in data ? data.data : data as T
}
export async function listUsers(): Promise<UserRecord[]> {
   const response = await api.get('/users')
   const data = unpack<UserRecord[] | { data: UserRecord[] }>(response)
   return Array.isArray(data) ? data : data.data
}
export async function createUser(payload: UserPayload): Promise<void> {
   await api.post('/users', payload)
}
export async function updateUser(id: string, payload: Partial<UserPayload>): Promise<void> {
   await api.put(`/users/${encodeURIComponent(id)}`, payload)
}
export async function deleteUser(id: string): Promise<void> {
   await api.delete(`/users/${encodeURIComponent(id)}`)
}
export async function listUserTypes(): Promise<LookupOption[]> {
   return unpack<LookupOption[]>(await api.get('/user-types'))
}
export async function listDepartments(): Promise<LookupOption[]> {
   return unpack<LookupOption[]>(await api.get('/departments'))
}
