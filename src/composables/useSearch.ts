import { computed, ref } from 'vue'

import { useBudgetStore } from '@/stores/useBudgetStore'
import { useDebtStore } from '@/stores/useDebtStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useGoalStore } from '@/stores/useGoalStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useSubscriptionStore } from '@/stores/useSubscriptionStore'
import type { SearchResult } from '@/types/finance'

const matches = (query: string, values: Array<string | number | undefined>) =>
  values.join(' ').toLowerCase().includes(query)

export const useSearch = () => {
  const query = ref('')
  const expenses = useExpenseStore()
  const income = useIncomeStore()
  const budgets = useBudgetStore()
  const goals = useGoalStore()
  const subscriptions = useSubscriptionStore()
  const debts = useDebtStore()

  const results = computed<SearchResult[]>(() => {
    const normalized = query.value.trim().toLowerCase()
    if (!normalized) return []

    const allResults: SearchResult[] = [
      ...expenses.activeExpenses.map((expense) => ({
        id: expense.id,
        title: expense.title,
        description: expense.description,
        type: 'expense' as const,
        amount: expense.amount,
        date: expense.date,
        href: `/expenses/edit/${expense.id}`
      })),
      ...income.activeIncome.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: 'income' as const,
        amount: item.amount,
        date: item.date,
        href: '/income'
      })),
      ...budgets.budgets.map((budget) => ({
        id: budget.id,
        title: budget.name,
        description: `${budget.period} · seuil ${budget.alertThreshold}%`,
        type: 'budget' as const,
        amount: budget.amount,
        href: '/budgets'
      })),
      ...goals.goals.map((goal) => ({
        id: goal.id,
        title: goal.name,
        description: `${goal.currentAmount} / ${goal.targetAmount}`,
        type: 'goal' as const,
        amount: goal.targetAmount,
        date: goal.dueDate,
        href: '/goals'
      })),
      ...subscriptions.subscriptions.map((subscription) => ({
        id: subscription.id,
        title: subscription.name,
        description: `${subscription.recurrence} · notification J-${subscription.notifyBeforeDays}`,
        type: 'subscription' as const,
        amount: subscription.amount,
        date: subscription.renewalDate,
        href: '/subscriptions'
      })),
      ...debts.debts.map((debt) => ({
        id: debt.id,
        title: debt.person,
        description: debt.direction === 'owed_by_me' ? 'Je dois' : 'On me doit',
        type: 'debt' as const,
        amount: debt.amount,
        date: debt.dueDate,
        href: '/debts'
      }))
    ]

    return allResults.filter((result) =>
      matches(normalized, [
        result.title,
        result.description,
        result.amount,
        result.date,
        result.type
      ])
    )
  })

  return { query, results }
}
