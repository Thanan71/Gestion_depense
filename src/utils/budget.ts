import dayjs from 'dayjs'

import type { Budget, BudgetPeriod, Category, Expense } from '@/types/finance'

const periodUnits: Record<BudgetPeriod, 'week' | 'month' | 'year'> = {
  weekly: 'week',
  monthly: 'month',
  yearly: 'year'
}

export const isInBudgetPeriod = (
  expenseDate: string,
  period: BudgetPeriod,
  referenceDate: Date | string = new Date()
) => {
  const date = dayjs(expenseDate)
  return date.isValid() && date.isSame(dayjs(referenceDate), periodUnits[period])
}

const isCategoryOrChild = (
  categoryId: string | undefined,
  budgetCategoryId: string,
  categories: Category[]
) => {
  if (!categoryId) return false
  if (categoryId === budgetCategoryId) return true

  let current = categories.find((category) => category.id === categoryId)
  const visited = new Set<string>()

  while (current?.parentId && !visited.has(current.id)) {
    visited.add(current.id)
    if (current.parentId === budgetCategoryId) return true
    current = categories.find((category) => category.id === current?.parentId)
  }

  return false
}

export const expenseMatchesBudgetCategory = (
  expense: Pick<Expense, 'categoryId' | 'subCategoryId'>,
  budget: Pick<Budget, 'categoryId'>,
  categories: Category[]
) => {
  if (!budget.categoryId) return true
  return (
    isCategoryOrChild(expense.categoryId, budget.categoryId, categories) ||
    isCategoryOrChild(expense.subCategoryId, budget.categoryId, categories)
  )
}

export const spentForBudget = (
  budget: Budget,
  expenses: Expense[],
  categories: Category[],
  referenceDate: Date | string = new Date()
) =>
  expenses
    .filter((expense) => !expense.archived)
    .filter((expense) => isInBudgetPeriod(expense.date, budget.period, referenceDate))
    .filter((expense) => expenseMatchesBudgetCategory(expense, budget, categories))
    .reduce((total, expense) => total + expense.amount, 0)
