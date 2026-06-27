<script setup lang="ts">
import { Download, Upload } from 'lucide-vue-next'
import { ref } from 'vue'

import { useExport } from '@/composables/useExport'
import { useImport } from '@/composables/useImport'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useNotificationStore } from '@/stores/useNotificationStore'

const expenseStore = useExpenseStore()
const incomeStore = useIncomeStore()
const notificationStore = useNotificationStore()
const { exportJson, exportCsv } = useExport()
const { importJson } = useImport()
const importFile = ref<HTMLInputElement>()

const download = (content: string, type: string, extension: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `gestion-depense-${new Date().toISOString().slice(0, 10)}.${extension}`
  anchor.click()
  URL.revokeObjectURL(url)
}

const downloadBackup = () => download(exportJson(), 'application/json', 'json')
const downloadCsv = () =>
  download(
    exportCsv([...expenseStore.activeExpenses, ...incomeStore.activeIncome]),
    'text/csv;charset=utf-8',
    'csv'
  )

const handleImport = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importJson(await file.text())
  notificationStore.push({
    title: 'Import terminé',
    message: 'Les données locales ont été restaurées. Recharge la page pour tout réhydrater.',
    type: 'success'
  })
  input.value = ''
}
</script>

<template>
  <section class="grid">
    <div class="page-header">
      <div>
        <h1>Rapports</h1>
        <p class="muted">Export JSON, CSV et restauration locale.</p>
      </div>
    </div>

    <section class="card pad">
      <div class="topbar-actions">
        <button class="btn primary" type="button" @click="downloadBackup">
          <Download :size="18" />
          Export JSON
        </button>
        <button class="btn" type="button" @click="downloadCsv">
          <Download :size="18" />
          Export CSV
        </button>
        <button class="btn" type="button" @click="importFile?.click()">
          <Upload :size="18" />
          Import JSON
        </button>
        <input ref="importFile" hidden type="file" accept="application/json" @change="handleImport" />
      </div>
    </section>

    <section class="grid stats">
      <article class="card pad metric">
        <span class="metric-label">Dépenses exportables</span>
        <strong class="metric-value">{{ expenseStore.activeExpenses.length }}</strong>
      </article>
      <article class="card pad metric">
        <span class="metric-label">Revenus exportables</span>
        <strong class="metric-value">{{ incomeStore.activeIncome.length }}</strong>
      </article>
    </section>
  </section>
</template>
