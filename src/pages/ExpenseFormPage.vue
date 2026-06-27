<script setup lang="ts">
import { Save } from 'lucide-vue-next'
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAccountStore } from '@/stores/useAccountStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import type { Recurrence } from '@/types/finance'
import { PAYMENT_METHODS } from '@/utils/constants'
import { validateTransaction } from '@/utils/validators'

const route = useRoute()
const router = useRouter()
const expenseStore = useExpenseStore()
const categoryStore = useCategoryStore()
const accountStore = useAccountStore()

const editedExpense = computed(() =>
  expenseStore.expenses.find((expense) => expense.id === route.params.id)
)
const isEdit = computed(() => Boolean(route.params.id))

interface ExpenseFormState {
  title: string
  description: string
  amount: number
  date: string
  time: string
  categoryId: string
  subCategoryId: string
  accountId: string
  paymentMethod: string
  tags: string
  location: string
  recurrence: Recurrence
}

const form = reactive<ExpenseFormState>({
  title: editedExpense.value?.title ?? '',
  description: editedExpense.value?.description ?? '',
  amount: editedExpense.value?.amount ?? 0,
  date: editedExpense.value?.date ?? new Date().toISOString().slice(0, 10),
  time: editedExpense.value?.time ?? '12:00',
  categoryId: editedExpense.value?.categoryId ?? 'misc',
  subCategoryId: editedExpense.value?.subCategoryId ?? '',
  accountId: editedExpense.value?.accountId ?? 'current',
  paymentMethod: editedExpense.value?.paymentMethod ?? 'CB',
  tags: editedExpense.value?.tags.join(', ') ?? '',
  location: editedExpense.value?.location ?? '',
  recurrence: editedExpense.value?.recurrence ?? 'none'
})

const save = () => {
  const validation = validateTransaction(form)
  if (!validation.valid) {
    window.alert(Object.values(validation.errors).join('\n'))
    return
  }

  const payload = {
    ...form,
    amount: Number(form.amount),
    tags: form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    subCategoryId: form.subCategoryId || undefined,
    location: form.location || undefined
  }

  if (editedExpense.value) expenseStore.update(editedExpense.value.id, payload)
  else expenseStore.add(payload)

  router.push('/expenses')
}
</script>

<template>
  <form class="card pad" @submit.prevent="save">
    <div class="page-header">
      <div>
        <h1>{{ isEdit ? 'Modifier la dépense' : 'Nouvelle dépense' }}</h1>
        <p class="muted">Tous les champs importants sont prêts pour le stockage local.</p>
      </div>
      <button class="btn primary" type="submit">
        <Save :size="18" />
        Enregistrer
      </button>
    </div>

    <div class="form-grid">
      <label class="field">
        <span>Titre</span>
        <input v-model="form.title" class="input" required />
      </label>
      <label class="field">
        <span>Montant</span>
        <input v-model.number="form.amount" class="input" min="0" step="0.01" type="number" required />
      </label>
      <label class="field">
        <span>Date</span>
        <input v-model="form.date" class="input" type="date" required />
      </label>
      <label class="field">
        <span>Heure</span>
        <input v-model="form.time" class="input" type="time" required />
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
        <span>Compte</span>
        <select v-model="form.accountId" class="select">
          <option v-for="account in accountStore.accounts" :key="account.id" :value="account.id">
            {{ account.name }}
          </option>
        </select>
      </label>
      <label class="field">
        <span>Mode de paiement</span>
        <select v-model="form.paymentMethod" class="select">
          <option v-for="method in PAYMENT_METHODS" :key="method" :value="method">{{ method }}</option>
        </select>
      </label>
      <label class="field">
        <span>Répétition</span>
        <select v-model="form.recurrence" class="select">
          <option value="none">Aucune</option>
          <option value="daily">Quotidienne</option>
          <option value="weekly">Hebdomadaire</option>
          <option value="monthly">Mensuelle</option>
          <option value="yearly">Annuelle</option>
        </select>
      </label>
      <label class="field">
        <span>Tags</span>
        <input v-model="form.tags" class="input" placeholder="maison, abonnement" />
      </label>
      <label class="field">
        <span>Localisation</span>
        <input v-model="form.location" class="input" placeholder="Paris, supermarché..." />
      </label>
      <label class="field" style="grid-column: 1 / -1">
        <span>Description</span>
        <textarea v-model="form.description" class="textarea" />
      </label>
    </div>
  </form>
</template>
