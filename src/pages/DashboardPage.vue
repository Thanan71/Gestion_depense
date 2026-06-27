<script setup lang="ts">
import {
  Banknote,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  ReceiptText,
  Target,
  WalletCards
} from 'lucide-vue-next'
import { computed } from 'vue'

import StatisticCard from '@/components/common/cards/StatisticCard.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import DashboardCard from '@/components/dashboard/DashboardCard.vue'
import ExpenseCard from '@/components/expenses/ExpenseCard.vue'
import { useCurrency } from '@/composables/useCurrency'
import { useStatistics } from '@/composables/useStatistics'
import { statisticsService } from '@/services/analytics/statisticsService'
import { useBudgetStore } from '@/stores/useBudgetStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useGoalStore } from '@/stores/useGoalStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useSubscriptionStore } from '@/stores/useSubscriptionStore'

const expenseStore = useExpenseStore()
const incomeStore = useIncomeStore()
const budgetStore = useBudgetStore()
const goalStore = useGoalStore()
const settingsStore = useSettingsStore()
const subscriptionStore = useSubscriptionStore()
const { formatCurrency } = useCurrency()
const { monthlyExpenses, monthlyIncome, balance, budgetRemaining, budgetUsedPercent } =
  useStatistics()

const monthlyEvolution = computed(() =>
  statisticsService.monthlySeries(expenseStore.activeExpenses, incomeStore.activeIncome)
)
const chartLabels = computed(() => monthlyEvolution.value.map((item) => item.label))
const chartDatasets = computed(() => [
  {
    label: 'Dépenses',
    values: monthlyEvolution.value.map((item) => item.expenses),
    color: '#db2777'
  },
  {
    label: 'Revenus',
    values: monthlyEvolution.value.map((item) => item.income),
    color: '#2563eb'
  }
])
const currentMonthExpenses = computed(() => monthlyEvolution.value.at(-1)?.expenses ?? 0)
const previousMonthExpenses = computed(() => monthlyEvolution.value.at(-2)?.expenses ?? 0)
const expenseDeltaLabel = computed(() => {
  const previous = previousMonthExpenses.value
  const current = currentMonthExpenses.value
  if (previous === 0) return current === 0 ? 'Stable' : 'Nouveau mois'
  const delta = Math.round(((current - previous) / previous) * 100)
  return `${delta >= 0 ? '+' : ''}${delta}% vs mois dernier`
})
const hasWidget = (widget: string) =>
  (settingsStore.settings.dashboardWidgets ?? []).includes(widget)
</script>

<template>
  <div class="grid" style="gap: 22px">
    <section class="grid stats">
      <StatisticCard
        v-if="hasWidget('balance')"
        label="Solde actuel"
        :value="formatCurrency(balance)"
        tone="primary"
        :icon="CircleDollarSign"
      />
      <StatisticCard
        v-if="hasWidget('income')"
        label="Revenus du mois"
        :value="formatCurrency(monthlyIncome)"
        tone="blue"
        :icon="Banknote"
      />
      <StatisticCard
        v-if="hasWidget('expenses')"
        label="Dépenses du mois"
        :value="formatCurrency(monthlyExpenses)"
        tone="pink"
        :icon="ReceiptText"
      />
      <StatisticCard
        v-if="hasWidget('budget')"
        label="Budget restant"
        :value="formatCurrency(budgetRemaining)"
        tone="amber"
        :icon="WalletCards"
      />
    </section>

    <section class="grid two">
      <DashboardCard v-if="hasWidget('chart')" title="Évolution mensuelle">
        <template #action>
          <span class="badge">{{ expenseDeltaLabel }}</span>
        </template>
        <BarChart :labels="chartLabels" :datasets="chartDatasets" />
      </DashboardCard>

      <DashboardCard v-if="hasWidget('alerts')" title="Alertes">
        <div class="list">
          <div class="list-item">
            <WalletCards :size="22" />
            <div>
              <strong>Budget utilisé à {{ budgetUsedPercent }}%</strong>
              <div class="muted">
                {{ budgetStore.monthlyBudget?.name ?? 'Budget mensuel' }} est suivi en local.
              </div>
            </div>
            <span />
          </div>
          <div class="list-item">
            <ReceiptText :size="22" />
            <div>
              <strong>{{ expenseStore.recentExpenses.length }} opérations récentes</strong>
              <div class="muted">Les données sont sauvegardées en local puis synchronisées.</div>
            </div>
            <span />
          </div>
        </div>
      </DashboardCard>
    </section>

    <section class="grid two">
      <DashboardCard v-if="hasWidget('recent')" title="Dépenses récentes">
        <template #action>
          <RouterLink class="btn" to="/expenses">Voir tout</RouterLink>
        </template>
        <div class="list">
          <ExpenseCard
            v-for="expense in expenseStore.recentExpenses"
            :key="expense.id"
            :expense="expense"
            @duplicate="expenseStore.duplicate"
            @archive="expenseStore.archive"
          />
        </div>
      </DashboardCard>

      <DashboardCard v-if="hasWidget('goals')" title="Objectifs">
        <div class="list">
          <article v-for="goal in goalStore.goals" :key="goal.id" class="list-item">
            <Target :size="22" />
            <div>
              <strong>{{ goal.name }}</strong>
              <div class="muted">
                {{ formatCurrency(goal.currentAmount) }} / {{ formatCurrency(goal.targetAmount) }}
              </div>
              <div class="progress" style="margin-top: 8px">
                <span :style="{ width: `${goalStore.progress(goal)}%` }" />
              </div>
            </div>
            <strong>{{ goalStore.progress(goal) }}%</strong>
          </article>
        </div>
      </DashboardCard>
    </section>

    <section v-if="hasWidget('subscriptions')" class="grid two">
      <DashboardCard title="Abonnements">
        <template #action>
          <RouterLink class="btn" to="/subscriptions">Gérer</RouterLink>
        </template>
        <div class="list">
          <article
            v-for="subscription in subscriptionStore.subscriptions.slice(0, 4)"
            :key="subscription.id"
            class="list-item"
          >
            <CreditCard :size="22" />
            <div>
              <strong>{{ subscription.name }}</strong>
              <div class="muted">{{ subscription.renewalDate }} · {{ subscription.recurrence }}</div>
            </div>
            <strong>{{ formatCurrency(subscription.amount) }}</strong>
          </article>
        </div>
      </DashboardCard>

      <DashboardCard title="Calendrier rapide">
        <template #action>
          <RouterLink class="btn" to="/calendar">Ouvrir</RouterLink>
        </template>
        <div class="list">
          <article v-for="expense in expenseStore.recentExpenses.slice(0, 3)" :key="expense.id" class="list-item">
            <CalendarDays :size="22" />
            <div>
              <strong>{{ expense.date }}</strong>
              <div class="muted">{{ expense.title }}</div>
            </div>
            <span>{{ formatCurrency(expense.amount) }}</span>
          </article>
        </div>
      </DashboardCard>
    </section>
  </div>
</template>
