<script setup lang="ts">
import { Search } from 'lucide-vue-next'

import { useCurrency } from '@/composables/useCurrency'
import { useSearch } from '@/composables/useSearch'

const { formatCurrency } = useCurrency()
const { query, results } = useSearch()
</script>

<template>
  <div class="global-search">
    <Search :size="17" />
    <input v-model="query" type="search" placeholder="Recherche globale" aria-label="Recherche globale" />
    <div v-if="results.length" class="search-results">
      <RouterLink v-for="result in results.slice(0, 8)" :key="result.id" :to="result.href">
        <strong>{{ result.title }}</strong>
        <span>{{ result.description }}</span>
        <small v-if="result.amount">{{ formatCurrency(result.amount) }}</small>
      </RouterLink>
    </div>
  </div>
</template>
