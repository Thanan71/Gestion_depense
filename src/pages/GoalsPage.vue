<script setup lang="ts">
import { Plus, Target, Trash2 } from 'lucide-vue-next'
import { reactive } from 'vue'

import { useCurrency } from '@/composables/useCurrency'
import { useGoalStore } from '@/stores/useGoalStore'

const goalStore = useGoalStore()
const { formatCurrency } = useCurrency()

const form = reactive({
  name: '',
  targetAmount: 0,
  currentAmount: 0,
  dueDate: '',
  icon: 'Target'
})

const addGoal = () => {
  if (!form.name.trim() || form.targetAmount <= 0) return
  goalStore.add({
    name: form.name.trim(),
    targetAmount: Number(form.targetAmount),
    currentAmount: Number(form.currentAmount),
    dueDate: form.dueDate || undefined,
    icon: form.icon
  })
  form.name = ''
  form.targetAmount = 0
  form.currentAmount = 0
}
</script>

<template>
  <section class="grid">
    <form class="card pad form-grid" @submit.prevent="addGoal">
      <label class="field">
        <span>Objectif</span>
        <input v-model="form.name" class="input" placeholder="Vacances, PC, voiture..." required />
      </label>
      <label class="field">
        <span>Montant cible</span>
        <input v-model.number="form.targetAmount" class="input" min="0" step="0.01" type="number" required />
      </label>
      <label class="field">
        <span>Déjà économisé</span>
        <input v-model.number="form.currentAmount" class="input" min="0" step="0.01" type="number" />
      </label>
      <label class="field">
        <span>Date cible</span>
        <input v-model="form.dueDate" class="input" type="date" />
      </label>
      <div class="field" style="align-content: end">
        <button class="btn primary" type="submit">
          <Plus :size="18" />
          Ajouter
        </button>
      </div>
    </form>

    <section class="grid two">
      <article v-for="goal in goalStore.goals" :key="goal.id" class="card pad">
        <div class="section-title">
          <h2>{{ goal.name }}</h2>
          <div class="topbar-actions">
            <Target :size="20" />
            <button class="btn icon-btn danger" type="button" @click="goalStore.remove(goal.id)">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
        <strong class="metric-value">{{ goalStore.progress(goal) }}%</strong>
        <p class="muted">{{ formatCurrency(goal.currentAmount) }} / {{ formatCurrency(goal.targetAmount) }}</p>
        <div class="progress">
          <span :style="{ width: `${goalStore.progress(goal)}%` }" />
        </div>
        <div class="topbar-actions" style="margin-top: 14px">
          <button class="btn" type="button" @click="goalStore.contribute(goal.id, 50)">+50 €</button>
          <button class="btn" type="button" @click="goalStore.contribute(goal.id, 100)">+100 €</button>
        </div>
      </article>
    </section>
  </section>
</template>
