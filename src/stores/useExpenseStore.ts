import dayjs from 'dayjs'
import { defineStore } from 'pinia'

import type { Expense } from '@/types/finance'
import { DEFAULT_EXPENSES } from '@/utils/constants'
import { createId, currentTime, todayIso } from '@/utils/helpers'
import { useNotificationStore } from './useNotificationStore'

export type ExpenseDraft = Omit<Expense, 'id' | 'kind' | 'archived' | 'createdAt' | 'updatedAt'>

export const useExpenseStore = defineStore('expenses', {
  state: () => ({
    expenses: DEFAULT_EXPENSES as Expense[],
    query: '',
    categoryFilter: 'all',
    periodFilter: 'month' as 'today' | 'week' | 'month' | 'year' | 'all'
  }),
  getters: {
    activeExpenses: (state) => state.expenses.filter((expense) => !expense.archived),
    currentMonthTotal(): number {
      const month = dayjs().format('YYYY-MM')
      return this.activeExpenses
        .filter((expense) => expense.date.startsWith(month))
        .reduce((sum, expense) => sum + expense.amount, 0)
    },
    recentExpenses(): Expense[] {
      return [...this.activeExpenses]
        .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
        .slice(0, 5)
    },
    filteredExpenses(): Expense[] {
      const query = this.query.trim().toLowerCase()
      const now = dayjs()
      return this.activeExpenses.filter((expense) => {
        const expenseDate = dayjs(expense.date)
        const matchesQuery =
          !query ||
          [expense.title, expense.description, expense.paymentMethod, ...expense.tags]
            .join(' ')
            .toLowerCase()
            .includes(query)
        const matchesCategory =
          this.categoryFilter === 'all' || expense.categoryId === this.categoryFilter
        const matchesPeriod =
          this.periodFilter === 'all' ||
          (this.periodFilter === 'today' && expenseDate.isSame(now, 'day')) ||
          (this.periodFilter === 'week' && expenseDate.isSame(now, 'week')) ||
          (this.periodFilter === 'month' && expenseDate.isSame(now, 'month')) ||
          (this.periodFilter === 'year' && expenseDate.isSame(now, 'year'))
        return matchesQuery && matchesCategory && matchesPeriod
      })
    }
  },
  actions: {
    add(payload: Partial<ExpenseDraft>) {
      const now = new Date().toISOString()
      const expense: Expense = {
        id: createId('expense'),
        kind: 'expense',
        title: payload.title ?? 'Nouvelle dépense',
        description: payload.description ?? '',
        amount: Number(payload.amount ?? 0),
        date: payload.date ?? todayIso(),
        time: payload.time ?? currentTime(),
        categoryId: payload.categoryId ?? 'misc',
        subCategoryId: payload.subCategoryId,
        accountId: payload.accountId ?? 'current',
        paymentMethod: payload.paymentMethod ?? 'CB',
        tags: payload.tags ?? [],
        receiptPhoto: payload.receiptPhoto,
        location: payload.location,
        recurrence: payload.recurrence ?? 'none',
        archived: false,
        createdAt: now,
        updatedAt: now
      }
      this.expenses.unshift(expense)
      useNotificationStore().push({
        title: 'Dépense ajoutée',
        message: `${expense.title} a été enregistrée en local.`,
        type: 'success'
      })
      return expense
    },
    update(id: string, patch: Partial<Expense>) {
      const expense = this.expenses.find((item) => item.id === id)
      if (!expense) return
      Object.assign(expense, patch, { updatedAt: new Date().toISOString() })
      useNotificationStore().push({
        title: 'Dépense mise à jour',
        message: `${expense.title} a été modifiée.`,
        type: 'success'
      })
    },
    duplicate(id: string) {
      const source = this.expenses.find((expense) => expense.id === id)
      if (!source) return
      this.add({ ...source, title: `${source.title} (copie)` })
    },
    archive(id: string) {
      this.update(id, { archived: true })
    },
    remove(id: string) {
      this.expenses = this.expenses.filter((expense) => expense.id !== id)
      useNotificationStore().push({
        title: 'Dépense supprimée',
        message: 'La dépense a été retirée définitivement.',
        type: 'warning'
      })
    }
  }
})
