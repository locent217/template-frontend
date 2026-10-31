/** Returns the backend-generated support reference for an Axios error. */
export function getRequestId(error: unknown): string | null {
   if (!error || typeof error !== 'object') {
       return null
   }
   const id = (error as { auditRequestId?: unknown }).auditRequestId
   return typeof id === 'string' ? id : null
}
