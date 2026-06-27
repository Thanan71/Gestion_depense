<script setup lang="ts">
import { X } from 'lucide-vue-next'

import { useNotificationStore } from '@/stores/useNotificationStore'

const notificationStore = useNotificationStore()
</script>

<template>
  <aside class="toast-stack" aria-live="polite">
    <article
      v-for="notification in notificationStore.notifications.slice(0, 4)"
      :key="notification.id"
      class="toast"
      :data-type="notification.type"
    >
      <div>
        <strong>{{ notification.title }}</strong>
        <p>{{ notification.message }}</p>
      </div>
      <button
        class="btn icon-btn"
        type="button"
        title="Fermer"
        @click="notificationStore.dismiss(notification.id)"
      >
        <X :size="16" />
      </button>
    </article>
  </aside>
</template>
