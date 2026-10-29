import { api } from '@/services/api'

export interface MaintenanceStatus {
   enabled: boolean
   message: string
   updated_at: string | null
}

export const maintenanceService = {
   async status(): Promise<MaintenanceStatus> {
      const { data } = await api.get<{ data: MaintenanceStatus }>('/system/maintenance/status')
      return data.data
   },
   async update(enabled: boolean): Promise<MaintenanceStatus> {
      const { data } = await api.put<{ data: MaintenanceStatus }>('/system/maintenance', { enabled })
      return data.data
   },
}
