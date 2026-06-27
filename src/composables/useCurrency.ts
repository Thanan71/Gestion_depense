import { computed } from 'vue'

import { useSettingsStore } from '@/stores/useSettingsStore'

export const useCurrency = () => {
  const settingsStore = useSettingsStore()

  const formatter = computed(
    () =>
      new Intl.NumberFormat(settingsStore.settings.locale, {
        style: 'currency',
        currency: settingsStore.settings.currency
      })
  )

  return {
    formatCurrency: (amount: number) => formatter.value.format(amount)
  }
}
