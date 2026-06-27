import dayjs from 'dayjs'

import type { Expense, Income } from '@/types/finance'

export const statisticsService = {
  monthlySeries(expenses: Expense[], income: Income[]) {
    return Array.from({ length: 6 }, (_, index) => {
      const month = dayjs().subtract(5 - index, 'month')
      const key = month.format('YYYY-MM')
      return {
        label: month.format('MMM'),
        expenses: expenses
          .filter((expense) => expense.date.startsWith(key))
          .reduce((sum, expense) => sum + expense.amount, 0),
        income: income
          .filter((item) => item.date.startsWith(key))
          .reduce((sum, item) => sum + item.amount, 0)
      }
    })
  },
  byCategory(expenses: Expense[]) {
    return expenses.reduce<Record<string, number>>((totals, expense) => {
      totals[expense.categoryId] = (totals[expense.categoryId] ?? 0) + expense.amount
      return totals
    }, {})
  }
}
