<script setup lang="ts">
import { Plus, Trash2, WalletCards } from 'lucide-vue-next'
import { computed, reactive, ref } from 'vue'

import { useCurrency } from '@/composables/useCurrency'
import { useBudgetStore } from '@/stores/useBudgetStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import type { BudgetPeriod } from '@/types/finance'

const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()
const expenseStore = useExpenseStore()
const { formatCurrency } = useCurrency()

const form = reactive({
  name: '',
  amount: 0,
  period: 'monthly' as BudgetPeriod,
  categoryId: '',
  alertThreshold: 80
})
const periodFilter = ref<BudgetPeriod | 'all'>('all')

const periodLabels: Record<BudgetPeriod, string> = {
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  yearly: 'Annuel'
}

const visibleBudgets = computed(() =>
  budgetStore.budgets.filter(
    (budget) => periodFilter.value === 'all' || budget.period === periodFilter.value
  )
)

const budgetRows = computed(() =>
  visibleBudgets.value.map((budget) => {
    const spent = budgetStore.spent(budget, expenseStore.activeExpenses, categoryStore.categories)
    const usedPercent = budgetStore.usedPercentFor(
      budget,
      expenseStore.activeExpenses,
      categoryStore.categories
    )
    const remaining = budget.amount - spent
    const status =
      usedPercent >= 100 ? 'danger' : usedPercent >= budget.alertThreshold ? 'warning' : 'ok'
    const progressColor =
      status === 'danger'
        ? 'var(--danger)'
        : status === 'warning'
          ? 'var(--amber)'
          : 'var(--primary)'

    return {
      budget,
      spent,
      remaining,
      usedPercent,
      progressColor,
      categoryName: budget.categoryId
        ? (categoryStore.byId(budget.categoryId)?.name ?? 'Catégorie inconnue')
        : 'Global'
    }
  })
)

const addBudget = () => {
  if (!form.name.trim() || form.amount <= 0) return
  budgetStore.add({
    name: form.name.trim(),
    amount: Number(form.amount),
    period: form.period,
    categoryId: form.categoryId || undefined,
    alertThreshold: Number(form.alertThreshold)
  })
  form.name = ''
  form.amount = 0
}

const removeBudget = (id: string) => {
  if (window.confirm('Supprimer ce budget ?')) budgetStore.remove(id)
}
</script>

<template>
  <section class="grid">
    <div class="page-header">
      <div>
        <h1>Budgets</h1>
        <p class="muted">Budgets mensuels, hebdomadaires, annuels, par catégorie et alertes.</p>
      </div>
      <label class="field">
        <span class="muted">Période</span>
        <select v-model="periodFilter" class="select">
          <option value="all">Toutes</option>
          <option value="weekly">Hebdomadaire</option>
          <option value="monthly">Mensuel</option>
          <option value="yearly">Annuel</option>
        </select>
      </label>
    </div>

    <form class="card pad form-grid" @submit.prevent="addBudget">
      <label class="field">
        <span>Nom</span>
        <input v-model="form.name" class="input" required />
      </label>
      <label class="field">
        <span>Montant</span>
        <input v-model.number="form.amount" class="input" min="0" step="0.01" type="number" required />
      </label>
      <label class="field">
        <span>Période</span>
        <select v-model="form.period" class="select">
          <option value="weekly">Hebdomadaire</option>
          <option value="monthly">Mensuel</option>
          <option value="yearly">Annuel</option>
        </select>
      </label>
      <label class="field">
        <span>Catégorie</span>
        <select v-model="form.categoryId" class="select">
          <option value="">Global</option>
          <option v-for="category in categoryStore.categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </label>
      <label class="field">
        <span>Alerte (%)</span>
        <input v-model.number="form.alertThreshold" class="input" min="1" max="100" type="number" />
      </label>
      <div class="field" style="align-content: end">
        <button class="btn primary" type="submit">
          <Plus :size="18" />
          Ajouter
        </button>
      </div>
    </form>

    <div class="grid two">
      <article v-for="row in budgetRows" :key="row.budget.id" class="card pad">
        <div class="section-title">
          <h2>{{ row.budget.name }}</h2>
          <div class="topbar-actions">
            <WalletCards :size="20" />
            <button class="btn icon-btn danger" type="button" @click="removeBudget(row.budget.id)">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
        <strong class="metric-value">{{ formatCurrency(row.budget.amount) }}</strong>
        <p class="muted">
          {{ periodLabels[row.budget.period] }} · {{ row.categoryName }} · alerte à
          {{ row.budget.alertThreshold }}%
        </p>
        <div class="list" style="margin: 14px 0">
          <div class="list-item">
            <span>Dépensé</span>
            <span />
            <strong>{{ formatCurrency(row.spent) }}</strong>
          </div>
          <div class="list-item">
            <span>Reste</span>
            <span />
            <strong>{{ formatCurrency(row.remaining) }}</strong>
          </div>
          <div class="list-item">
            <span>Utilisé</span>
            <span />
            <strong>{{ row.usedPercent }}%</strong>
          </div>
        </div>
        <div class="progress">
          <span
            :style="{
              width: `${Math.min(row.usedPercent, 100)}%`,
              background: row.progressColor
            }"
          />
        </div>
      </article>
    </div>
  </section>
</template>
