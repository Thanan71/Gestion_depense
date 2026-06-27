import type { StoreGeneric } from 'pinia'
import { nextTick, onMounted, ref, watch } from 'vue'

import { remoteSyncService } from '@/services/sync/remoteSyncService'
import { useAccountStore } from '@/stores/useAccountStore'
import { useBudgetStore } from '@/stores/useBudgetStore'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { useDebtStore } from '@/stores/useDebtStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useGoalStore } from '@/stores/useGoalStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useSubscriptionStore } from '@/stores/useSubscriptionStore'
import type { AppSnapshot } from '@/types/sync'

const SYNC_ENABLED = import.meta.env.VITE_SYNC_ENABLED === 'true'
const SYNC_PROVIDER = import.meta.env.VITE_SYNC_PROVIDER

const trackedStores = (): StoreGeneric[] => [
  useExpenseStore(),
  useIncomeStore(),
  useBudgetStore(),
  useCategoryStore(),
  useSettingsStore(),
  useGoalStore(),
  useSubscriptionStore(),
  useDebtStore(),
  useAccountStore()
]

const createSnapshot = (stores: StoreGeneric[]): AppSnapshot => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  stores: Object.fromEntries(
    stores.map((store) => [store.$id, JSON.parse(JSON.stringify(store.$state))])
  )
})

export const useRemoteSync = () => {
  const status = ref<'disabled' | 'loading' | 'synced' | 'offline' | 'error'>('disabled')
  const notificationStore = useNotificationStore()

  onMounted(async () => {
    if (!SYNC_ENABLED || SYNC_PROVIDER !== 'postgres') return

    const stores = trackedStores()
    status.value = 'loading'

    try {
      const pulled = await remoteSyncService.pull()
      if (pulled.ok && pulled.snapshot?.stores) {
        for (const store of stores) {
          const savedState = pulled.snapshot.stores[store.$id]
          if (savedState) store.$patch(savedState)
        }
      } else if (pulled.ok) {
        await remoteSyncService.push(createSnapshot(stores))
      }

      await nextTick()
      status.value = 'synced'

      let timeout: number | undefined
      watch(
        () => stores.map((store) => store.$state),
        () => {
          window.clearTimeout(timeout)
          timeout = window.setTimeout(async () => {
            try {
              const pushed = await remoteSyncService.push(createSnapshot(stores))
              status.value = pushed.ok ? 'synced' : 'error'
            } catch {
              status.value = 'offline'
            }
          }, 800)
        },
        { deep: true }
      )
    } catch {
      status.value = 'offline'
      notificationStore.push({
        title: 'Synchronisation distante indisponible',
        message: 'Les données restent sauvegardées localement dans le navigateur.',
        type: 'warning'
      })
    }
  })

  return { status }
}
