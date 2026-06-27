import { defineStore } from 'pinia'

import type { Settings } from '@/types/finance'
import { DEFAULT_SETTINGS } from '@/utils/constants'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: DEFAULT_SETTINGS as Settings
  }),
  actions: {
    update(patch: Partial<Settings>) {
      this.settings = { ...this.settings, ...patch }
    },
    toggleTheme() {
      this.settings.theme = this.settings.theme === 'dark' ? 'light' : 'dark'
    },
    toggleWidget(widget: string) {
      this.settings.dashboardWidgets ??= []
      if (this.settings.dashboardWidgets.includes(widget)) {
        this.settings.dashboardWidgets = this.settings.dashboardWidgets.filter(
          (item) => item !== widget
        )
      } else {
        this.settings.dashboardWidgets.push(widget)
      }
    }
  }
})
