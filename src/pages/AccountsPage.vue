<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import { reactive } from 'vue'

import { useCurrency } from '@/composables/useCurrency'
import { useAccountStore } from '@/stores/useAccountStore'
import type { Account } from '@/types/finance'

const accountStore = useAccountStore()
const { formatCurrency } = useCurrency()

const form = reactive({
  name: '',
  type: 'bank' as Account['type'],
  balance: 0
})

const addAccount = () => {
  if (!form.name.trim()) return
  accountStore.add({ name: form.name.trim(), type: form.type, balance: Number(form.balance) })
  form.name = ''
  form.balance = 0
}
</script>

<template>
  <section class="grid two">
    <form class="card pad" @submit.prevent="addAccount">
      <div class="section-title">
        <h2>Nouveau compte</h2>
        <button class="btn primary" type="submit">
          <Plus :size="18" />
          Ajouter
        </button>
      </div>
      <div class="form-grid">
        <label class="field">
          <span>Nom</span>
          <input v-model="form.name" class="input" required />
        </label>
        <label class="field">
          <span>Type</span>
          <select v-model="form.type" class="select">
            <option value="cash">Espèces</option>
            <option value="bank">Compte courant</option>
            <option value="savings">Livret</option>
            <option value="paypal">Paypal</option>
            <option value="crypto">Crypto</option>
          </select>
        </label>
        <label class="field" style="grid-column: 1 / -1">
          <span>Solde initial</span>
          <input v-model.number="form.balance" class="input" step="0.01" type="number" />
        </label>
      </div>
    </form>

    <section class="card pad">
      <div class="section-title">
        <h2>Comptes</h2>
        <strong>{{ formatCurrency(accountStore.totalBalance) }}</strong>
      </div>
      <div class="list">
        <article v-for="account in accountStore.accounts" :key="account.id" class="list-item">
          <span class="badge">{{ account.type }}</span>
          <div>
            <strong>{{ account.name }}</strong>
            <div class="muted">{{ formatCurrency(account.balance) }}</div>
          </div>
          <button class="btn icon-btn danger" type="button" @click="accountStore.remove(account.id)">
            <Trash2 :size="16" />
          </button>
        </article>
      </div>
    </section>
  </section>
</template>
