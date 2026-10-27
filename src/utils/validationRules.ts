/** Shared Vuetify rules. Each rule returns true or an error message. */
export type ValidationRule = (value: unknown) => true | string

export const rules = {
   required: (value: unknown): true | string => {
      if (typeof value === 'string') {
         return value.trim().length > 0 || 'This field is required.'
      }

      return (value !== null && value !== undefined && value !== '') || 'This field is required.'
   },

   email: (value: unknown): true | string => {
      return (typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
         || 'Enter a valid email address.'
   },

   username: (value: unknown): true | string => {
      return (typeof value === 'string' && /^[A-Za-z0-9._-]{3,50}$/.test(value.trim()))
         || 'Use 3–50 letters, numbers, dots, underscores or hyphens.'
   },

   minLength: (length: number): ValidationRule => (value: unknown) => {
      return (typeof value === 'string' && value.length >= length)
         || `Must contain at least ${length} characters.`
   },

   maxLength: (length: number): ValidationRule => (value: unknown) => {
      return (typeof value === 'string' && value.length <= length)
         || `Must contain no more than ${length} characters.`
   },
}
