<script setup lang="ts">
import { BarChart3 } from 'lucide-vue-next'
import { computed } from 'vue'

import BarChart from '@/components/common/charts/BarChart.vue'
import { useCurrency } from '@/composables/useCurrency'
import { useStatistics } from '@/composables/useStatistics'
import { statisticsService } from '@/services/analytics/statisticsService'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useIncomeStore } from '@/stores/useIncomeStore'

const expenseStore = useExpenseStore()
const incomeStore = useIncomeStore()
const categoryStore = useCategoryStore()
const { formatCurrency } = useCurrency()
const { monthlyExpenses, monthlyIncome, balance, budgetUsedPercent } = useStatistics()

const series = computed(() =>
  statisticsService.monthlySeries(expenseStore.activeExpenses, incomeStore.activeIncome)
)
const byCategory = computed(() => statisticsService.byCategory(expenseStore.activeExpenses))
const categoryRows = computed(() =>
  Object.entries(byCategory.value)
    .map(([categoryId, amount]) => ({
      name: categoryStore.byId(categoryId)?.name ?? categoryId,
      amount
    }))
    .sort((a, b) => b.amount - a.amount)
)
</script>

<template>
  <section class="grid">
    <div class="page-header">
      <div>
        <h1>Statistiques</h1>
        <p class="muted">Dépenses, revenus, balance, catégories et évolution.</p>
      </div>
      <BarChart3 :size="28" />
    </div>

    <div class="grid stats">
      <div class="card pad metric">
        <span class="metric-label">Dépenses</span>
        <strong class="metric-value">{{ formatCurrency(monthlyExpenses) }}</strong>
      </div>
      <div class="card pad metric">
        <span class="metric-label">Revenus</span>
        <strong class="metric-value">{{ formatCurrency(monthlyIncome) }}</strong>
      </div>
      <div class="card pad metric">
        <span class="metric-label">Balance</span>
        <strong class="metric-value">{{ formatCurrency(balance) }}</strong>
      </div>
      <div class="card pad metric">
        <span class="metric-label">Budget utilisé</span>
        <strong class="metric-value">{{ budgetUsedPercent }}%</strong>
      </div>
    </div>

    <section class="grid two">
      <article class="card pad">
        <div class="section-title">
          <h2>Évolution 6 mois</h2>
        </div>
        <BarChart :labels="series.map((item) => item.label)" :values="series.map((item) => item.expenses)" />
      </article>

      <article class="card pad">
        <div class="section-title">
          <h2>Catégories</h2>
          <span class="badge">{{ categoryRows.length }}</span>
        </div>
        <div class="list">
          <div v-for="row in categoryRows" :key="row.name" class="list-item">
            <span class="category-dot" />
            <strong>{{ row.name }}</strong>
            <span>{{ formatCurrency(row.amount) }}</span>
          </div>
        </div>
      </article>
    </section>
  </section>
</template>
