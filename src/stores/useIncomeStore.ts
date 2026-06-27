import dayjs from 'dayjs'
import { defineStore } from 'pinia'

import type { Income } from '@/types/finance'
import { DEFAULT_INCOME, initialDemoItems } from '@/utils/constants'
import { createId, currentTime, todayIso } from '@/utils/helpers'

export type IncomeDraft = Omit<Income, 'id' | 'kind' | 'archived' | 'createdAt' | 'updatedAt'>

export const useIncomeStore = defineStore('income', {
  state: () => ({
    income: initialDemoItems(DEFAULT_INCOME) as Income[]
  }),
  getters: {
    activeIncome: (state) => state.income.filter((item) => !item.archived),
    currentMonthTotal(): number {
      const month = dayjs().format('YYYY-MM')
      return this.activeIncome
        .filter((item) => item.date.startsWith(month))
        .reduce((sum, item) => sum + item.amount, 0)
    }
  },
  actions: {
    add(payload: Partial<IncomeDraft>) {
      const now = new Date().toISOString()
      const income: Income = {
        id: createId('income'),
        kind: 'income',
        title: payload.title ?? 'Nouveau revenu',
        description: payload.description ?? '',
        amount: Number(payload.amount ?? 0),
        date: payload.date ?? todayIso(),
        time: payload.time ?? currentTime(),
        categoryId: payload.categoryId ?? 'salary',
        accountId: payload.accountId ?? 'current',
        paymentMethod: payload.paymentMethod ?? 'Virement',
        tags: payload.tags ?? [],
        recurrence: payload.recurrence ?? 'none',
        archived: false,
        createdAt: now,
        updatedAt: now
      }
      this.income.unshift(income)
      return income
    },
    update(id: string, patch: Partial<Income>) {
      const income = this.income.find((item) => item.id === id)
      if (income) Object.assign(income, patch, { updatedAt: new Date().toISOString() })
    },
    duplicate(id: string) {
      const source = this.income.find((income) => income.id === id)
      if (source) this.add({ ...source, title: `${source.title} (copie)` })
    },
    archive(id: string) {
      this.update(id, { archived: true })
    },
    remove(id: string) {
      this.income = this.income.filter((income) => income.id !== id)
    }
  }
})
