<script setup lang="ts">
import { Plus, Trash2, WalletCards } from 'lucide-vue-next'
import { reactive } from 'vue'

import { useCurrency } from '@/composables/useCurrency'
import { useStatistics } from '@/composables/useStatistics'
import { useBudgetStore } from '@/stores/useBudgetStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import type { BudgetPeriod } from '@/types/finance'

const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()
const { formatCurrency } = useCurrency()
const { monthlyExpenses } = useStatistics()

const form = reactive({
  name: '',
  amount: 0,
  period: 'monthly' as BudgetPeriod,
  categoryId: '',
  alertThreshold: 80
})

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
</script>

<template>
  <section class="grid">
    <div class="page-header">
      <div>
        <h1>Budgets</h1>
        <p class="muted">Budgets mensuels, hebdomadaires, annuels, par catégorie et alertes.</p>
      </div>
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
      <article v-for="budget in budgetStore.budgets" :key="budget.id" class="card pad">
        <div class="section-title">
          <h2>{{ budget.name }}</h2>
          <div class="topbar-actions">
            <WalletCards :size="20" />
            <button class="btn icon-btn danger" type="button" @click="budgetStore.remove(budget.id)">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
        <strong class="metric-value">{{ formatCurrency(budget.amount) }}</strong>
        <p class="muted">{{ budget.period }} · alerte à {{ budget.alertThreshold }}%</p>
        <div class="progress">
          <span :style="{ width: `${Math.min(budgetStore.usedPercent(monthlyExpenses), 100)}%` }" />
        </div>
      </article>
    </div>
  </section>
</template>
