import { defineStore } from 'pinia'

import type { Budget } from '@/types/finance'
import { DEFAULT_BUDGETS } from '@/utils/constants'
import { clamp, createId } from '@/utils/helpers'

export const useBudgetStore = defineStore('budgets', {
  state: () => ({
    budgets: DEFAULT_BUDGETS as Budget[]
  }),
  getters: {
    monthlyBudget: (state) => state.budgets.find((budget) => budget.period === 'monthly'),
    remaining: (state) => (spent: number) => {
      const total = state.budgets
        .filter((budget) => budget.period === 'monthly')
        .reduce((sum, budget) => sum + budget.amount, 0)
      return total - spent
    },
    usedPercent: (state) => (spent: number) => {
      const total = state.budgets
        .filter((budget) => budget.period === 'monthly')
        .reduce((sum, budget) => sum + budget.amount, 0)
      return total > 0 ? clamp(Math.round((spent / total) * 100), 0, 999) : 0
    }
  },
  actions: {
    add(payload: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date().toISOString()
      this.budgets.push({ ...payload, id: createId('budget'), createdAt: now, updatedAt: now })
    },
    upsert(budget: Budget) {
      const index = this.budgets.findIndex((item) => item.id === budget.id)
      if (index >= 0) this.budgets[index] = { ...budget, updatedAt: new Date().toISOString() }
      else this.budgets.push(budget)
    },
    remove(id: string) {
      this.budgets = this.budgets.filter((budget) => budget.id !== id)
    }
  }
})
