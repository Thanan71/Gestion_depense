import { usePreferredDark } from '@vueuse/core'
import { computed, watchEffect } from 'vue'

import { useSettingsStore } from '@/stores/useSettingsStore'

export const useTheme = () => {
  const settingsStore = useSettingsStore()
  const preferredDark = usePreferredDark()

  const isDark = computed(() =>
    settingsStore.settings.theme === 'auto'
      ? preferredDark.value
      : settingsStore.settings.theme === 'dark'
  )

  watchEffect(() => {
    document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
  })

  return { isDark, toggleTheme: settingsStore.toggleTheme }
}
