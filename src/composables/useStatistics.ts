import { computed } from 'vue'

import { useBudgetStore } from '@/stores/useBudgetStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useIncomeStore } from '@/stores/useIncomeStore'

export const useStatistics = () => {
  const expenseStore = useExpenseStore()
  const incomeStore = useIncomeStore()
  const budgetStore = useBudgetStore()
  const categoryStore = useCategoryStore()

  const monthlyExpenses = computed(() => expenseStore.currentMonthTotal)
  const monthlyIncome = computed(() => incomeStore.currentMonthTotal)
  const balance = computed(() => monthlyIncome.value - monthlyExpenses.value)
  const budgetRemaining = computed(() =>
    budgetStore.remaining(expenseStore.activeExpenses, categoryStore.categories)
  )
  const budgetUsedPercent = computed(() =>
    budgetStore.usedPercent(expenseStore.activeExpenses, categoryStore.categories)
  )

  return {
    monthlyExpenses,
    monthlyIncome,
    balance,
    budgetRemaining,
    budgetUsedPercent
  }
}
