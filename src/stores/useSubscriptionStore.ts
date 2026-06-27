import { defineStore } from 'pinia'

import type { Subscription } from '@/types/finance'
import { DEFAULT_SUBSCRIPTIONS } from '@/utils/constants'
import { createId } from '@/utils/helpers'

export const useSubscriptionStore = defineStore('subscriptions', {
  state: () => ({
    subscriptions: DEFAULT_SUBSCRIPTIONS as Subscription[]
  }),
  getters: {
    monthlyTotal: (state) =>
      state.subscriptions.reduce((sum, subscription) => sum + subscription.amount, 0)
  },
  actions: {
    add(payload: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date().toISOString()
      this.subscriptions.push({
        ...payload,
        id: createId('subscription'),
        createdAt: now,
        updatedAt: now
      })
    },
    update(id: string, patch: Partial<Subscription>) {
      const subscription = this.subscriptions.find((item) => item.id === id)
      if (subscription) Object.assign(subscription, patch, { updatedAt: new Date().toISOString() })
    },
    remove(id: string) {
      this.subscriptions = this.subscriptions.filter((subscription) => subscription.id !== id)
    }
  }
})
