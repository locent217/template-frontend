/**
 * Stable codes defined by Laravel's DepartmentSeeder and UserTypeSeeder.
 * Update this file if the backend's canonical codes change.
 * Never compare a department's display name or a guessed abbreviation.
 */
export const DEPARTMENT_CODES = {
   INFORMATION_TECHNOLOGY: 'INFORMATION_TECHNOLOGY',
   AUDIT: 'AUDIT',
   ACCOUNT_MANAGEMENT: 'ACCOUNT_MANAGEMENT',
   CLAIMS: 'CLAIMS',
   HUMAN_RESOURCE: 'HUMAN_RESOURCE',
   EXECUTIVE: 'EXECUTIVE',
   LEGAL: 'LEGAL',
   EXTERNAL_OPERATIONS: 'EXTERNAL_OPERATIONS',
} as const

export const USER_TYPE_CODES = {
   SUPER_ADMIN: 'SUPER_ADMIN',
   ADMIN: 'ADMIN',
   MANAGER: 'MANAGER',
   DIRECTOR: 'DIRECTOR',
   STAFF: 'STAFF',
   CLIENT: 'CLIENT',
} as const

export function normalizedCode(code?: string | null): string {
   return code?.trim().toUpperCase() ?? ''
}
