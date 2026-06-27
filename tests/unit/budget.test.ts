import { describe, expect, it } from 'vitest'

import type { Budget, Category, Expense } from '@/types/finance'
import { spentForBudget } from '@/utils/budget'

const categories: Category[] = [
  { id: 'food', name: 'Alimentation', icon: 'Utensils', color: '#0f766e' },
  { id: 'groceries', name: 'Courses', icon: 'ShoppingBasket', color: '#2dd4bf', parentId: 'food' },
  { id: 'leisure', name: 'Loisirs', icon: 'Gamepad2', color: '#db2777' }
]

const budget = (patch: Partial<Budget>): Budget => ({
  id: 'budget-test',
  name: 'Budget test',
  amount: 500,
  period: 'monthly',
  alertThreshold: 80,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  ...patch
})

const expense = (patch: Partial<Expense>): Expense => ({
  id: 'expense-test',
  kind: 'expense',
  title: 'Achat test',
  description: '',
  amount: 100,
  date: '2026-06-16',
  time: '12:00',
  categoryId: 'misc',
  accountId: 'current',
  paymentMethod: 'CB',
  tags: [],
  recurrence: 'none',
  archived: false,
  createdAt: '2026-06-16T12:00:00.000Z',
  updatedAt: '2026-06-16T12:00:00.000Z',
  ...patch
})

describe('spentForBudget', () => {
  it('counts only the selected category and its children', () => {
    const result = spentForBudget(
      budget({ categoryId: 'food' }),
      [
        expense({ id: 'food-direct', amount: 20, categoryId: 'food' }),
        expense({ id: 'food-child', amount: 30, categoryId: 'groceries' }),
        expense({ id: 'leisure', amount: 80, categoryId: 'leisure' })
      ],
      categories,
      '2026-06-20'
    )

    expect(result).toBe(50)
  })

  it('counts every category for a global monthly budget', () => {
    const result = spentForBudget(
      budget({ categoryId: undefined }),
      [
        expense({ id: 'food', amount: 20, categoryId: 'food' }),
        expense({ id: 'leisure', amount: 80, categoryId: 'leisure' }),
        expense({ id: 'previous-month', amount: 200, categoryId: 'food', date: '2026-05-30' })
      ],
      categories,
      '2026-06-20'
    )

    expect(result).toBe(100)
  })

  it('uses the budget period instead of the current month total', () => {
    const result = spentForBudget(
      budget({ period: 'weekly', categoryId: 'food' }),
      [
        expense({ id: 'same-week', amount: 25, categoryId: 'food', date: '2026-06-16' }),
        expense({ id: 'same-month-other-week', amount: 75, categoryId: 'food', date: '2026-06-02' })
      ],
      categories,
      '2026-06-17'
    )

    expect(result).toBe(25)
  })

  it('ignores archived expenses', () => {
    const result = spentForBudget(
      budget({ categoryId: 'food' }),
      [expense({ id: 'archived', amount: 45, categoryId: 'food', archived: true })],
      categories,
      '2026-06-20'
    )

    expect(result).toBe(0)
  })
})
