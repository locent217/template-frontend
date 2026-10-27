/** VITE_ variables are embedded into the browser bundle at build time. */
const bool = (value: string | undefined): boolean => value === 'true'

export const appConfig = {
   name: import.meta.env.VITE_APP_NAME || 'Company Management System',
   shortName: import.meta.env.VITE_APP_SHORT_NAME || 'Workspace',
   title: import.meta.env.VITE_APP_TITLE || 'Company Management System',
   description: import.meta.env.VITE_APP_DESCRIPTION || '',
   companyName: import.meta.env.VITE_COMPANY_NAME || 'My Company',
   apiUrl: import.meta.env.VITE_API_URL,
   backendUrl: import.meta.env.VITE_BACKEND_URL,
   environment: import.meta.env.MODE,
   isDevelopment: import.meta.env.DEV,
   isProduction: import.meta.env.PROD,
   enableRegistration: bool(import.meta.env.VITE_ENABLE_REGISTRATION),
   enableDebug: bool(import.meta.env.VITE_ENABLE_DEBUG) && import.meta.env.DEV,
} as const
