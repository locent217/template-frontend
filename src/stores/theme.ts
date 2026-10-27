import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useTheme } from 'vuetify'

const ACCENTS = ['#8955f6', '#4f80ed', '#10a99c', '#ed8b35', '#df5a91']
export const useAppearanceStore = defineStore('appearance', () => {
  const vuetifyTheme = useTheme()
  const mode = ref<'light' | 'dark'>(localStorage.getItem('ui.mode') === 'dark' ? 'dark' : 'light')
  const accent = ref(localStorage.getItem('ui.accent') || ACCENTS[0]!)
  const isDark = computed(() => mode.value === 'dark')
  function apply() {
    vuetifyTheme.global.name.value = isDark.value ? 'appDark' : 'appLight'
    for (const name of ['appLight', 'appDark']) vuetifyTheme.themes.value[name]!.colors.primary = accent.value
    localStorage.setItem('ui.mode', mode.value)
    localStorage.setItem('ui.accent', accent.value)
  }
  watch([mode, accent], apply, { immediate: true })
  return { mode, accent, isDark, accents: ACCENTS, apply }
})
