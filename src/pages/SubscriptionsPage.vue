<script setup lang="ts">
import { CreditCard, Plus, Trash2 } from 'lucide-vue-next'
import { reactive } from 'vue'

import { useCurrency } from '@/composables/useCurrency'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useSubscriptionStore } from '@/stores/useSubscriptionStore'
import type { Subscription } from '@/types/finance'

const subscriptionStore = useSubscriptionStore()
const categoryStore = useCategoryStore()
const { formatCurrency } = useCurrency()

const form = reactive({
  name: '',
  amount: 0,
  renewalDate: new Date().toISOString().slice(0, 10),
  recurrence: 'monthly' as Subscription['recurrence'],
  notifyBeforeDays: 1,
  categoryId: 'leisure'
})

const addSubscription = () => {
  if (!form.name.trim() || form.amount <= 0) return
  subscriptionStore.add({ ...form, amount: Number(form.amount) })
  form.name = ''
  form.amount = 0
}
</script>

<template>
  <section class="grid">
    <div class="page-header">
      <div>
        <h1>Abonnements</h1>
        <p class="muted">Renouvellements, notifications et total mensuel estimé.</p>
      </div>
      <strong class="metric-value">{{ formatCurrency(subscriptionStore.monthlyTotal) }}</strong>
    </div>

    <form class="card pad form-grid" @submit.prevent="addSubscription">
      <label class="field">
        <span>Nom</span>
        <input v-model="form.name" class="input" placeholder="Netflix, Spotify, ChatGPT..." required />
      </label>
      <label class="field">
        <span>Montant</span>
        <input v-model.number="form.amount" class="input" min="0" step="0.01" type="number" required />
      </label>
      <label class="field">
        <span>Renouvellement</span>
        <input v-model="form.renewalDate" class="input" type="date" />
      </label>
      <label class="field">
        <span>Récurrence</span>
        <select v-model="form.recurrence" class="select">
          <option value="weekly">Hebdomadaire</option>
          <option value="monthly">Mensuelle</option>
          <option value="yearly">Annuelle</option>
        </select>
      </label>
      <label class="field">
        <span>Notification J-</span>
        <input v-model.number="form.notifyBeforeDays" class="input" min="0" type="number" />
      </label>
      <label class="field">
        <span>Catégorie</span>
        <select v-model="form.categoryId" class="select">
          <option v-for="category in categoryStore.categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </label>
      <div class="field" style="align-content: end">
        <button class="btn primary" type="submit">
          <Plus :size="18" />
          Ajouter
        </button>
      </div>
    </form>

    <div class="card pad list">
      <article v-for="subscription in subscriptionStore.subscriptions" :key="subscription.id" class="list-item">
        <CreditCard :size="22" />
        <div>
          <strong>{{ subscription.name }}</strong>
          <div class="muted">
            {{ subscription.renewalDate }} · {{ subscription.recurrence }} · J-{{
              subscription.notifyBeforeDays
            }}
          </div>
        </div>
        <div class="topbar-actions">
          <strong>{{ formatCurrency(subscription.amount) }}</strong>
          <button
            class="btn icon-btn danger"
            type="button"
            @click="subscriptionStore.remove(subscription.id)"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
