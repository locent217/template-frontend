import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useTheme } from 'vuetify'

const ACCENTS = ['#2563eb', '#4f80ed', '#10a99c', '#ed8b35', '#df5a91']
export const useAppearanceStore = defineStore('appearance', () => {
  const vuetifyTheme = useTheme()
  const mode = ref<'light' | 'dark'>(localStorage.getItem('ui.mode') === 'dark' ? 'dark' : 'light')
  const savedAccent = localStorage.getItem('ui.accent')
  const accent = ref(savedAccent && ACCENTS.includes(savedAccent) ? savedAccent : ACCENTS[0]!)
  const isDark = computed(() => mode.value === 'dark')
  function apply() {
    vuetifyTheme.change(isDark.value ? 'appDark' : 'appLight')
    for (const name of ['appLight', 'appDark']) vuetifyTheme.themes.value[name]!.colors.primary = accent.value
    localStorage.setItem('ui.mode', mode.value)
    localStorage.setItem('ui.accent', accent.value)
  }
  watch([mode, accent], apply, { immediate: true })
  return { mode, accent, isDark, accents: ACCENTS, apply }
})
