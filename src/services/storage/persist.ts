import type { PiniaPluginContext } from 'pinia'
import type { StateTree } from 'pinia'
import { watch } from 'vue'

import { localStorageService } from '@/services/storage/localStorageService'

const PERSISTED_STORES = new Set([
  'expenses',
  'income',
  'budgets',
  'categories',
  'settings',
  'goals',
  'subscriptions',
  'debts',
  'accounts'
])

export const localPersistPlugin = ({ store }: PiniaPluginContext) => {
  if (!PERSISTED_STORES.has(store.$id)) return

  const key = `gestion-depense:${store.$id}`
  const savedState = localStorageService.get<StateTree | null>(key, null)
  if (savedState) store.$patch(savedState)

  watch(
    () => store.$state,
    (state) => localStorageService.set(key, state),
    { deep: true }
  )
}
