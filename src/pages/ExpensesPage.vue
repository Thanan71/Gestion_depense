<script setup lang="ts">
import { Plus, Search } from 'lucide-vue-next'

import ExpenseCard from '@/components/expenses/ExpenseCard.vue'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useExpenseStore } from '@/stores/useExpenseStore'

const expenseStore = useExpenseStore()
const categoryStore = useCategoryStore()

const confirmArchive = (id: string) => {
  if (window.confirm('Archiver cette dépense ?')) expenseStore.archive(id)
}
</script>

<template>
  <section>
    <div class="page-header">
      <div>
        <h1>Dépenses</h1>
        <p class="muted">Ajout, modification, duplication, archivage, recherche et filtres.</p>
      </div>
      <RouterLink class="btn primary" to="/expenses/new">
        <Plus :size="18" />
        Ajouter une dépense
      </RouterLink>
    </div>

    <div class="filters">
      <label class="field">
        <span class="muted">Recherche globale</span>
        <span style="position: relative">
          <Search
            :size="17"
            style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%)"
          />
          <input
            v-model="expenseStore.query"
            class="input"
            style="padding-left: 36px"
            type="search"
            placeholder="Nom, montant, tag, description..."
          />
        </span>
      </label>

      <label class="field">
        <span class="muted">Catégorie</span>
        <select v-model="expenseStore.categoryFilter" class="select">
          <option value="all">Toutes</option>
          <option v-for="category in categoryStore.rootCategories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </label>

      <label class="field">
        <span class="muted">Période</span>
        <select v-model="expenseStore.periodFilter" class="select">
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="year">Cette année</option>
          <option value="all">Tout</option>
        </select>
      </label>
    </div>

    <div class="card pad">
      <div class="list">
        <ExpenseCard
          v-for="expense in expenseStore.filteredExpenses"
          :key="expense.id"
          :expense="expense"
          @duplicate="expenseStore.duplicate"
          @archive="confirmArchive"
        />
      </div>
    </div>
  </section>
</template>
