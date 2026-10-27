import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
  icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  theme: {
    defaultTheme: 'appLight',
    themes: {
      appLight: { dark: false, colors: { primary: '#8955f6', secondary: '#69647a', background: '#f5f5fa', surface: '#ffffff', error: '#ef5350', success: '#36b37e' } },
      appDark: { dark: true, colors: { primary: '#a783ff', secondary: '#aaa4bb', background: '#171721', surface: '#232331', error: '#ff7777', success: '#56d9a3' } },
    },
  },
  defaults: { VBtn: { rounded: 'lg' }, VCard: { rounded: 'lg', elevation: 0 }, VTextField: { variant: 'outlined', density: 'comfortable' }, VSelect: { variant: 'outlined', density: 'comfortable' } },
})
