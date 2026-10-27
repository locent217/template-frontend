/// <reference types="vite/client" />

interface ImportMetaEnv {
   readonly VITE_APP_NAME?: string
   readonly VITE_APP_SHORT_NAME?: string
   readonly VITE_APP_TITLE?: string
   readonly VITE_APP_DESCRIPTION?: string
   readonly VITE_COMPANY_NAME?: string
   readonly VITE_API_URL?: string
   readonly VITE_ENABLE_REGISTRATION?: string
   readonly VITE_ENABLE_DEBUG?: string
}

interface ImportMeta {
   readonly env: ImportMetaEnv
}
