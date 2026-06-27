import { defineStore } from 'pinia'

import type { Debt } from '@/types/finance'
import { DEFAULT_DEBTS } from '@/utils/constants'
import { createId, todayIso } from '@/utils/helpers'

export const useDebtStore = defineStore('debts', {
  state: () => ({
    debts: DEFAULT_DEBTS as Debt[]
  }),
  getters: {
    owedByMe: (state) =>
      state.debts
        .filter((debt) => debt.direction === 'owed_by_me')
        .reduce((sum, debt) => sum + debt.amount, 0),
    owedToMe: (state) =>
      state.debts
        .filter((debt) => debt.direction === 'owed_to_me')
        .reduce((sum, debt) => sum + debt.amount, 0)
  },
  actions: {
    add(payload: Omit<Debt, 'id' | 'history' | 'createdAt' | 'updatedAt'>) {
      const now = new Date().toISOString()
      this.debts.push({
        ...payload,
        id: createId('debt'),
        history: [{ date: todayIso(), amount: payload.amount, note: 'Création' }],
        createdAt: now,
        updatedAt: now
      })
    },
    pay(id: string, amount: number) {
      const debt = this.debts.find((item) => item.id === id)
      if (!debt) return
      debt.amount = Math.max(0, debt.amount - amount)
      debt.history.unshift({ date: todayIso(), amount, note: 'Paiement' })
      debt.updatedAt = new Date().toISOString()
    },
    remove(id: string) {
      this.debts = this.debts.filter((debt) => debt.id !== id)
    }
  }
})
