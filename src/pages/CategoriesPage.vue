<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import { reactive } from 'vue'

import { useBudgetStore } from '@/stores/useBudgetStore'
import { useCategoryStore } from '@/stores/useCategoryStore'

const categoryStore = useCategoryStore()
const budgetStore = useBudgetStore()

const form = reactive({
  name: '',
  icon: 'Tag',
  color: '#0f766e',
  parentId: '',
  budgetId: ''
})

const addCategory = () => {
  if (!form.name.trim()) return
  categoryStore.add({
    name: form.name.trim(),
    icon: form.icon,
    color: form.color,
    parentId: form.parentId || undefined,
    budgetId: form.budgetId || undefined
  })
  form.name = ''
  form.parentId = ''
  form.budgetId = ''
}
</script>

<template>
  <section class="grid two">
    <form class="card pad" @submit.prevent="addCategory">
      <div class="section-title">
        <h2>Nouvelle catégorie</h2>
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
          <span>Couleur</span>
          <input v-model="form.color" class="input" type="color" />
        </label>
        <label class="field">
          <span>Icône</span>
          <input v-model="form.icon" class="input" />
        </label>
        <label class="field">
          <span>Parent</span>
          <select v-model="form.parentId" class="select">
            <option value="">Aucun</option>
            <option v-for="category in categoryStore.rootCategories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </label>
        <label class="field" style="grid-column: 1 / -1">
          <span>Budget associé</span>
          <select v-model="form.budgetId" class="select">
            <option value="">Aucun</option>
            <option v-for="budget in budgetStore.budgets" :key="budget.id" :value="budget.id">
              {{ budget.name }}
            </option>
          </select>
        </label>
      </div>
    </form>

    <section class="card pad">
      <div class="section-title">
        <h2>Catégories</h2>
        <span class="badge">{{ categoryStore.categories.length }}</span>
      </div>
      <div class="list">
        <article v-for="category in categoryStore.categories" :key="category.id" class="list-item">
          <span class="category-dot" :style="{ background: category.color }" />
          <div>
            <strong>{{ category.name }}</strong>
            <div class="muted">
              {{ category.parentId ? `Sous-catégorie de ${categoryStore.byId(category.parentId)?.name}` : 'Racine' }}
            </div>
          </div>
          <button class="btn icon-btn danger" type="button" @click="categoryStore.remove(category.id)">
            <Trash2 :size="16" />
          </button>
        </article>
      </div>
    </section>
  </section>
</template>
