<script setup lang="ts">
import { CircleDollarSign, Plus, Trash2 } from 'lucide-vue-next'
import { reactive } from 'vue'

import { useCurrency } from '@/composables/useCurrency'
import { useDebtStore } from '@/stores/useDebtStore'
import type { DebtDirection } from '@/types/finance'

const debtStore = useDebtStore()
const { formatCurrency } = useCurrency()

const form = reactive({
  person: '',
  amount: 0,
  direction: 'owed_to_me' as DebtDirection,
  dueDate: ''
})

const addDebt = () => {
  if (!form.person.trim() || form.amount <= 0) return
  debtStore.add({
    person: form.person.trim(),
    amount: Number(form.amount),
    direction: form.direction,
    dueDate: form.dueDate || undefined
  })
  form.person = ''
  form.amount = 0
}
</script>

<template>
  <section class="grid">
    <section class="grid stats">
      <article class="card pad metric">
        <span class="metric-label"><CircleDollarSign :size="18" /> Je dois</span>
        <strong class="metric-value">{{ formatCurrency(debtStore.owedByMe) }}</strong>
      </article>
      <article class="card pad metric">
        <span class="metric-label"><CircleDollarSign :size="18" /> On me doit</span>
        <strong class="metric-value">{{ formatCurrency(debtStore.owedToMe) }}</strong>
      </article>
    </section>

    <form class="card pad form-grid" @submit.prevent="addDebt">
      <label class="field">
        <span>Personne</span>
        <input v-model="form.person" class="input" required />
      </label>
      <label class="field">
        <span>Montant</span>
        <input v-model.number="form.amount" class="input" min="0" step="0.01" type="number" required />
      </label>
      <label class="field">
        <span>Sens</span>
        <select v-model="form.direction" class="select">
          <option value="owed_to_me">On me doit</option>
          <option value="owed_by_me">Je dois</option>
        </select>
      </label>
      <label class="field">
        <span>Échéance</span>
        <input v-model="form.dueDate" class="input" type="date" />
      </label>
      <div class="field" style="align-content: end">
        <button class="btn primary" type="submit">
          <Plus :size="18" />
          Ajouter
        </button>
      </div>
    </form>

    <section class="card pad list">
      <article v-for="debt in debtStore.debts" :key="debt.id" class="list-item">
        <span class="badge">{{ debt.direction === 'owed_by_me' ? 'Je dois' : 'On me doit' }}</span>
        <div>
          <strong>{{ debt.person }}</strong>
          <div class="muted">{{ debt.dueDate ?? 'Sans échéance' }} · {{ debt.history.length }} mouvement(s)</div>
        </div>
        <div class="topbar-actions">
          <strong>{{ formatCurrency(debt.amount) }}</strong>
          <button class="btn" type="button" @click="debtStore.pay(debt.id, Math.min(10, debt.amount))">
            Payer 10 €
          </button>
          <button class="btn icon-btn danger" type="button" @click="debtStore.remove(debt.id)">
            <Trash2 :size="16" />
          </button>
        </div>
      </article>
    </section>
  </section>
</template>
