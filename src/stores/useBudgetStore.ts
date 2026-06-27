import { defineStore } from 'pinia'

import type { Budget, Category, Expense } from '@/types/finance'
import { spentForBudget } from '@/utils/budget'
import { DEFAULT_BUDGETS, initialDefaultItems } from '@/utils/constants'
import { clamp, createId } from '@/utils/helpers'

export const useBudgetStore = defineStore('budgets', {
  state: () => ({
    budgets: initialDefaultItems(DEFAULT_BUDGETS) as Budget[]
  }),
  getters: {
    monthlyBudget: (state) => state.budgets.find((budget) => budget.period === 'monthly'),
    spent:
      () =>
      (budget: Budget, expenses: Expense[], categories: Category[], referenceDate = new Date()) =>
        spentForBudget(budget, expenses, categories, referenceDate),
    remainingFor:
      () =>
      (budget: Budget, expenses: Expense[], categories: Category[], referenceDate = new Date()) =>
        budget.amount - spentForBudget(budget, expenses, categories, referenceDate),
    usedPercentFor:
      () =>
      (budget: Budget, expenses: Expense[], categories: Category[], referenceDate = new Date()) => {
        if (budget.amount <= 0) return 0
        return clamp(
          Math.round(
            (spentForBudget(budget, expenses, categories, referenceDate) / budget.amount) * 100
          ),
          0,
          999
        )
      },
    remaining:
      (state) =>
      (expenses: Expense[], categories: Category[], referenceDate = new Date()) => {
        return state.budgets
          .filter((budget) => budget.period === 'monthly')
          .reduce(
            (sum, budget) =>
              sum + budget.amount - spentForBudget(budget, expenses, categories, referenceDate),
            0
          )
      },
    usedPercent:
      (state) =>
      (expenses: Expense[], categories: Category[], referenceDate = new Date()) => {
        const monthlyBudgets = state.budgets.filter((budget) => budget.period === 'monthly')
        const total = monthlyBudgets.reduce((sum, budget) => sum + budget.amount, 0)
        const spent = monthlyBudgets.reduce(
          (sum, budget) => sum + spentForBudget(budget, expenses, categories, referenceDate),
          0
        )
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
