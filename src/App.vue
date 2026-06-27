<script setup lang="ts">
import { Download, RotateCcw, X } from 'lucide-vue-next'

import { useRemoteSync } from '@/composables/useRemoteSync'

const { conflict, downloadConflictBackup, keepRemoteSnapshot, restoreConflictBackup } =
  useRemoteSync()
</script>

<template>
  <RouterView />
  <section v-if="conflict" class="sync-conflict-banner" role="alert">
    <div class="sync-conflict-copy">
      <strong>Conflit de synchronisation</strong>
      <span>{{ conflict.message }}</span>
    </div>
    <div class="sync-conflict-actions">
      <button class="btn" type="button" @click="downloadConflictBackup">
        <Download :size="16" />
        Télécharger local
      </button>
      <button class="btn primary" type="button" @click="restoreConflictBackup">
        <RotateCcw :size="16" />
        Restaurer local
      </button>
      <button
        aria-label="Garder la version distante"
        class="btn icon-btn"
        type="button"
        @click="keepRemoteSnapshot"
      >
        <X :size="16" />
      </button>
    </div>
  </section>
</template>
