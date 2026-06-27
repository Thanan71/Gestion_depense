<script setup lang="ts">
import { Banknote, Copy, Plus, Trash2 } from 'lucide-vue-next'
import { reactive } from 'vue'

import { useCurrency } from '@/composables/useCurrency'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { PAYMENT_METHODS } from '@/utils/constants'

const incomeStore = useIncomeStore()
const categoryStore = useCategoryStore()
const { formatCurrency } = useCurrency()

const form = reactive({
  title: '',
  amount: 0,
  categoryId: 'salary',
  paymentMethod: 'Virement',
  date: new Date().toISOString().slice(0, 10)
})

const addIncome = () => {
  if (!form.title.trim() || form.amount <= 0) return
  incomeStore.add({ ...form, description: '', time: '09:00', accountId: 'current', tags: [] })
  form.title = ''
  form.amount = 0
}
</script>

<template>
  <section class="grid">
    <div class="page-header">
      <div>
        <h1>Revenus</h1>
        <p class="muted">Salaire, prime, freelance, cadeau, investissement, allocation et autre.</p>
      </div>
    </div>

    <form class="card pad form-grid" @submit.prevent="addIncome">
      <label class="field">
        <span>Titre</span>
        <input v-model="form.title" class="input" placeholder="Prime, salaire..." required />
      </label>
      <label class="field">
        <span>Montant</span>
        <input v-model.number="form.amount" class="input" min="0" step="0.01" type="number" required />
      </label>
      <label class="field">
        <span>Catégorie</span>
        <select v-model="form.categoryId" class="select">
          <option v-for="category in categoryStore.categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </label>
      <label class="field">
        <span>Paiement</span>
        <select v-model="form.paymentMethod" class="select">
          <option v-for="method in PAYMENT_METHODS" :key="method" :value="method">{{ method }}</option>
        </select>
      </label>
      <label class="field">
        <span>Date</span>
        <input v-model="form.date" class="input" type="date" />
      </label>
      <div class="field" style="align-content: end">
        <button class="btn primary" type="submit">
          <Plus :size="18" />
          Ajouter
        </button>
      </div>
    </form>

    <div class="card pad list">
      <article v-for="income in incomeStore.activeIncome" :key="income.id" class="list-item">
        <Banknote :size="22" />
        <div>
          <strong>{{ income.title }}</strong>
          <div class="muted">{{ income.date }} · {{ income.paymentMethod }}</div>
        </div>
        <div class="topbar-actions">
          <strong>{{ formatCurrency(income.amount) }}</strong>
          <button class="btn icon-btn" type="button" title="Dupliquer" @click="incomeStore.duplicate(income.id)">
            <Copy :size="16" />
          </button>
          <button class="btn icon-btn danger" type="button" title="Archiver" @click="incomeStore.archive(income.id)">
            <Trash2 :size="16" />
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
