<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string
  tone?: 'primary' | 'blue' | 'pink' | 'amber'
  icon: Component
}>()
</script>

<template>
  <article class="card pad metric">
    <span class="metric-label">
      <component :is="icon" :size="18" />
      {{ label }}
    </span>
    <strong class="metric-value" :style="{ color: tone ? `var(--${tone})` : undefined }">
      {{ value }}
    </strong>
  </article>
</template>
