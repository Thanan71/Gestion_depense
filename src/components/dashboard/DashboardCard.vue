<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <section class="card pad">
    <div class="section-title">
      <h2>{{ title }}</h2>
      <slot name="action" />
    </div>
    <slot />
  </section>
</template>
