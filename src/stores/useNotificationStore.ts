import { defineStore } from 'pinia'

import { createId } from '@/utils/helpers'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  createdAt: string
}

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as AppNotification[]
  }),
  actions: {
    push(notification: Omit<AppNotification, 'id' | 'createdAt'>) {
      this.notifications.unshift({
        ...notification,
        id: createId('notification'),
        createdAt: new Date().toISOString()
      })
    },
    dismiss(id: string) {
      this.notifications = this.notifications.filter((item) => item.id !== id)
    },
    clear() {
      this.notifications = []
    }
  }
})
