<script setup lang="ts">
import { Copy, PenLine, Trash2 } from 'lucide-vue-next'

import { useCurrency } from '@/composables/useCurrency'
import { useCategoryStore } from '@/stores/useCategoryStore'
import type { Expense } from '@/types/finance'

defineProps<{ expense: Expense }>()
defineEmits<{
  duplicate: [id: string]
  archive: [id: string]
}>()

const categoryStore = useCategoryStore()
const { formatCurrency } = useCurrency()
</script>

<template>
  <article class="list-item">
    <span
      class="category-dot"
      :style="{ background: categoryStore.byId(expense.categoryId)?.color }"
      aria-hidden="true"
    />
    <div>
      <strong>{{ expense.title }}</strong>
      <div class="muted">
        {{ categoryStore.byId(expense.categoryId)?.name ?? 'Divers' }} · {{ expense.date }} ·
        {{ expense.paymentMethod }}
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 8px">
      <strong>{{ formatCurrency(expense.amount) }}</strong>
      <RouterLink class="btn icon-btn" :to="`/expenses/edit/${expense.id}`" title="Modifier">
        <PenLine :size="16" />
      </RouterLink>
      <button class="btn icon-btn" type="button" title="Dupliquer" @click="$emit('duplicate', expense.id)">
        <Copy :size="16" />
      </button>
      <button class="btn icon-btn danger" type="button" title="Archiver" @click="$emit('archive', expense.id)">
        <Trash2 :size="16" />
      </button>
    </div>
  </article>
</template>
