import { computed } from 'vue'

import { useBudgetStore } from '@/stores/useBudgetStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useIncomeStore } from '@/stores/useIncomeStore'

export const useStatistics = () => {
  const expenseStore = useExpenseStore()
  const incomeStore = useIncomeStore()
  const budgetStore = useBudgetStore()

  const monthlyExpenses = computed(() => expenseStore.currentMonthTotal)
  const monthlyIncome = computed(() => incomeStore.currentMonthTotal)
  const balance = computed(() => monthlyIncome.value - monthlyExpenses.value)
  const budgetRemaining = computed(() => budgetStore.remaining(monthlyExpenses.value))
  const budgetUsedPercent = computed(() => budgetStore.usedPercent(monthlyExpenses.value))

  return {
    monthlyExpenses,
    monthlyIncome,
    balance,
    budgetRemaining,
    budgetUsedPercent
  }
}
