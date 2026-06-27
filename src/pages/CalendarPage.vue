<script setup lang="ts">
import dayjs from 'dayjs'
import { computed } from 'vue'

import { useBudgetStore } from '@/stores/useBudgetStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useGoalStore } from '@/stores/useGoalStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useSubscriptionStore } from '@/stores/useSubscriptionStore'

const expenses = useExpenseStore()
const income = useIncomeStore()
const budgets = useBudgetStore()
const goals = useGoalStore()
const subscriptions = useSubscriptionStore()

const events = computed(() =>
  [
    ...expenses.activeExpenses.map((expense) => ({
      id: expense.id,
      date: expense.date,
      title: expense.title,
      type: 'Dépense'
    })),
    ...income.activeIncome.map((item) => ({
      id: item.id,
      date: item.date,
      title: item.title,
      type: 'Revenu'
    })),
    ...subscriptions.subscriptions.map((subscription) => ({
      id: subscription.id,
      date: subscription.renewalDate,
      title: subscription.name,
      type: 'Abonnement'
    })),
    ...goals.goals
      .filter((goal) => goal.dueDate)
      .map((goal) => ({
        id: goal.id,
        date: goal.dueDate as string,
        title: goal.name,
        type: 'Objectif'
      })),
    ...budgets.budgets.map((budget) => ({
      id: budget.id,
      date: dayjs().startOf('month').format('YYYY-MM-DD'),
      title: budget.name,
      type: 'Budget'
    }))
  ].sort((a, b) => a.date.localeCompare(b.date))
)
</script>

<template>
  <section class="card pad">
    <div class="page-header">
      <div>
        <h1>Calendrier</h1>
        <p class="muted">Dépenses, revenus, budgets, objectifs et abonnements réunis par date.</p>
      </div>
    </div>
    <div class="list">
      <article v-for="event in events" :key="`${event.type}-${event.id}`" class="list-item">
        <strong>{{ dayjs(event.date).format('DD MMM') }}</strong>
        <div>
          <strong>{{ event.title }}</strong>
          <div class="muted">{{ event.type }}</div>
        </div>
        <span class="badge">{{ dayjs(event.date).format('YYYY') }}</span>
      </article>
    </div>
  </section>
</template>
